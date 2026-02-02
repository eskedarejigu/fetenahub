from flask import Flask, request, jsonify
from supabase import create_client, Client
import os
from werkzeug.utils import secure_filename
import hashlib
import hmac
import json
from dotenv import load_dotenv
from urllib.parse import parse_qsl

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

def verify_telegram_data(init_data: str) -> bool:
    """Verify Telegram Web App init data per Telegram docs.

    init_data is a URL-encoded string like "id=...&first_name=...&auth_date=...&hash=..."
    """
    if not init_data:
        return False

    # Parse the key=value pairs
    try:
        data_items = dict(parse_qsl(init_data))
    except Exception:
        return False

    received_hash = data_items.pop('hash', None)
    if not received_hash:
        return False

    # Build data_check_string from remaining fields sorted by key
    data_check_list = [f"{k}={v}" for k, v in sorted(data_items.items())]
    data_check_string = "\n".join(data_check_list)

    # Per Telegram: secret_key = sha256(bot_token)
    secret_key = hashlib.sha256(TELEGRAM_BOT_TOKEN.encode()).digest()
    computed_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(computed_hash, received_hash)

@app.route('/')
def home():
    return jsonify({'message': 'ExamHub Backend is running!', 'endpoints': ['/exams', '/upload']})

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
    port = int(os.environ.get('PORT', 5000))
    # Do not enable debug in production
    app.run(host='0.0.0.0', port=port)