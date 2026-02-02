from flask import Flask, request, jsonify
from supabase import create_client, Client
import os
from werkzeug.utils import secure_filename
import hashlib
import hmac
import json
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Supabase setup
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY')
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def verify_telegram_data(init_data):
    # Verify Telegram Web App data
    data_check_string = init_data.replace('&', '\n').split('\n')
    data_check_string.sort()
    data_check_string = '\n'.join(data_check_string)
    secret_key = hmac.new(b'WebAppData', TELEGRAM_BOT_TOKEN.encode(), hashlib.sha256).digest()
    hash_value = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hash_value == request.args.get('hash')

@app.route('/exams', methods=['GET'])
def get_exams():
    university = request.args.get('university')
    year = request.args.get('year')
    subject = request.args.get('subject')
    
    query = supabase.table('exams').select('*')
    if university:
        query = query.eq('university', university)
    if year:
        query = query.eq('year', year)
    if subject:
        query = query.ilike('subject', f'%{subject}%')
    
    response = query.execute()
    return jsonify(response.data)

@app.route('/upload', methods=['POST'])
def upload_exam():
    if not verify_telegram_data(request.form.get('initData')):
        return jsonify({'error': 'Invalid Telegram data'}), 401
    
    user_data = json.loads(request.form.get('user'))
    user_id = user_data['id']
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file'}), 400
    
    university = request.form.get('university')
    year = request.form.get('year')
    subject = request.form.get('subject')
    
    if not all([university, year, subject]):
        return jsonify({'error': 'Missing metadata'}), 400
    
    filename = secure_filename(file.filename)
    file_path = f"exams/{user_id}/{filename}"
    
    # Upload to Supabase Storage
    supabase.storage.from_('exam-files').upload(file_path, file.read())
    file_url = supabase.storage.from_('exam-files').get_public_url(file_path)
    
    # Save to database
    data = {
        'university': university,
        'year': year,
        'subject': subject,
        'file_url': file_url,
        'uploaded_by': user_id
    }
    supabase.table('exams').insert(data).execute()
    
    return jsonify({'message': 'Upload successful'})

if __name__ == '__main__':
    app.run(debug=True)