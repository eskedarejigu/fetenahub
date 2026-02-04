"""
FetenaHub - Exam Sharing Platform API
Telegram Mini App Backend (Flask + Vercel Serverless)
"""

from flask import Flask, request, jsonify
from functools import wraps
import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime
from supabase import create_client, Client
from urllib.parse import unquote, parse_qsl

app = Flask(__name__)

# Supabase Configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://qbodxizbkfnsaiuznsxf.supabase.co')
SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFib2R4aXpia2Zuc2FpdXpuc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDg0NzUsImV4cCI6MjA4MjY4NDQ3NX0.xGsFBBbAUD5gdiYbiYLrvPu3p0lVn6tKdGCtGhZD7CM')
BOT_TOKEN = os.environ.get('BOT_TOKEN', '')

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ============== TELEGRAM AUTH ==============


def validate_telegram_data(init_data: str) -> dict:
    try:
        # 1. Properly parse the query string into a dictionary
        params = dict(parse_qsl(init_data))
        if 'hash' not in params:
            return None
        
        received_hash = params.pop('hash')
        
        # 2. Format the check string: Alphabetical order + Newlines
        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(params.items())
        )
        
        # 3. Derive Secret Key
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=BOT_TOKEN.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # 4. Calculate HMAC
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        if calculated_hash != received_hash:
            return None
        
        return json.loads(params['user']) if 'user' in params else {}
    except Exception as e:
        print(f"Auth error: {e}")
        return None




def require_auth(f):
    """Decorator to require Telegram authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('X-Telegram-Auth', '')
        if not auth_header:
            return jsonify({'error': 'Missing authentication'}), 401
        
        user_data = validate_telegram_data(auth_header)
        if not user_data:
            return jsonify({'error': 'Invalid authentication'}), 401
        
        request.telegram_user = user_data
        return f(*args, **kwargs)
    return decorated

# ============== USER ENDPOINTS ==============

@app.route('/api/auth/verify', methods=['POST'])
def verify_auth():
    """Verify Telegram auth and create/get user"""
    init_data = request.headers.get('X-Telegram-Auth', '')
    if not init_data:
        return jsonify({'error': 'Missing authentication'}), 401
    
    user_data = validate_telegram_data(init_data)
    if not user_data:
        return jsonify({'error': 'Invalid authentication'}), 401
    
    telegram_id = str(user_data.get('id'))
    
    # Check if user exists
    result = supabase.table('users').select('*').eq('telegram_id', telegram_id).execute()
    
    if not result.data:
        # Create new user
        new_user = {
            'id': str(uuid.uuid4()),
            'telegram_id': telegram_id,
            'username': user_data.get('username') or f"user_{telegram_id[-6:]}",
            'bio': '',
            'avatar_url': user_data.get('photo_url', ''),
            'created_at': datetime.utcnow().isoformat()
        }
        result = supabase.table('users').insert(new_user).execute()
        user = result.data[0]
    else:
        user = result.data[0]
        # Update avatar if changed
        if user_data.get('photo_url') and user.get('avatar_url') != user_data.get('photo_url'):
            supabase.table('users').update({'avatar_url': user_data.get('photo_url')}).eq('id', user['id']).execute()
    
    return jsonify({'user': user, 'success': True})

@app.route('/api/user/profile', methods=['GET'])
@require_auth
def get_profile():
    """Get current user profile"""
    telegram_id = str(request.telegram_user.get('id'))
    result = supabase.table('users').select('*').eq('telegram_id', telegram_id).execute()
    
    if not result.data:
        return jsonify({'error': 'User not found'}), 404
    
    user = result.data[0]
    
    # Get follower/following counts
    followers = supabase.table('follows').select('*').eq('following_id', user['id']).execute()
    following = supabase.table('follows').select('*').eq('follower_id', user['id']).execute()
    
    user['followers_count'] = len(followers.data)
    user['following_count'] = len(following.data)
    
    return jsonify({'user': user})

@app.route('/api/user/profile/<user_id>', methods=['GET'])
@require_auth
def get_user_profile(user_id):
    """Get another user's profile"""
    result = supabase.table('users').select('*').eq('id', user_id).execute()
    
    if not result.data:
        return jsonify({'error': 'User not found'}), 404
    
    user = result.data[0]
    current_user_telegram_id = str(request.telegram_user.get('id'))
    current_user_result = supabase.table('users').select('id').eq('telegram_id', current_user_telegram_id).execute()
    current_user_id = current_user_result.data[0]['id']
    
    # Get follower/following counts
    followers = supabase.table('follows').select('*').eq('following_id', user_id).execute()
    following = supabase.table('follows').select('*').eq('follower_id', user_id).execute()
    
    # Check if current user follows this user
    is_following = supabase.table('follows').select('*').eq('follower_id', current_user_id).eq('following_id', user_id).execute()
    
    user['followers_count'] = len(followers.data)
    user['following_count'] = len(following.data)
    user['is_following'] = len(is_following.data) > 0
    
    return jsonify({'user': user})

@app.route('/api/user/profile', methods=['PUT'])
@require_auth
def update_profile():
    """Update user profile"""
    telegram_id = str(request.telegram_user.get('id'))
    data = request.json
    
    result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    if not result.data:
        return jsonify({'error': 'User not found'}), 404
    
    user_id = result.data[0]['id']
    
    updates = {}
    if 'username' in data:
        updates['username'] = data['username']
    if 'bio' in data:
        updates['bio'] = data['bio']
    if 'avatar_url' in data:
        updates['avatar_url'] = data['avatar_url']
    
    if updates:
        result = supabase.table('users').update(updates).eq('id', user_id).execute()
        return jsonify({'user': result.data[0], 'success': True})
    
    return jsonify({'success': True})

# ============== FOLLOW ENDPOINTS ==============

@app.route('/api/follow/<user_id>', methods=['POST'])
@require_auth
def follow_user(user_id):
    """Follow a user"""
    telegram_id = str(request.telegram_user.get('id'))
    result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    follower_id = result.data[0]['id']
    
    # Check if already following
    existing = supabase.table('follows').select('*').eq('follower_id', follower_id).eq('following_id', user_id).execute()
    if existing.data:
        return jsonify({'success': True, 'message': 'Already following'})
    
    # Create follow
    follow_data = {
        'follower_id': follower_id,
        'following_id': user_id,
        'created_at': datetime.utcnow().isoformat()
    }
    supabase.table('follows').insert(follow_data).execute()
    
    return jsonify({'success': True})

@app.route('/api/follow/<user_id>', methods=['DELETE'])
@require_auth
def unfollow_user(user_id):
    """Unfollow a user"""
    telegram_id = str(request.telegram_user.get('id'))
    result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    follower_id = result.data[0]['id']
    
    supabase.table('follows').delete().eq('follower_id', follower_id).eq('following_id', user_id).execute()
    
    return jsonify({'success': True})

# ============== UNIVERSITY ENDPOINTS ==============

@app.route('/api/universities', methods=['GET'])
@require_auth
def get_universities():
    """Get all universities"""
    result = supabase.table('universities').select('*').order('name').execute()
    return jsonify({'universities': result.data})

@app.route('/api/universities', methods=['POST'])
@require_auth
def create_university():
    """Create a new university"""
    data = request.json
    
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    university = {
        'id': str(uuid.uuid4()),
        'name': data['name'],
        'created_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('universities').insert(university).execute()
    return jsonify({'university': result.data[0], 'success': True})

# ============== COURSE ENDPOINTS ==============

@app.route('/api/courses', methods=['GET'])
@require_auth
def get_courses():
    """Get all courses"""
    result = supabase.table('courses').select('*').order('name').execute()
    return jsonify({'courses': result.data})

@app.route('/api/courses', methods=['POST'])
@require_auth
def create_course():
    """Create a new course"""
    data = request.json
    
    if not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    course = {
        'id': str(uuid.uuid4()),
        'name': data['name'],
        'created_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('courses').insert(course).execute()
    return jsonify({'course': result.data[0], 'success': True})

# ============== EXAM ENDPOINTS ==============

@app.route('/api/exams', methods=['GET'])
@require_auth
def get_exams():
    """Get exams with filters"""
    university_id = request.args.get('university_id')
    course_id = request.args.get('course_id')
    year = request.args.get('year')
    search = request.args.get('search')
    user_id = request.args.get('user_id')
    feed_type = request.args.get('feed_type', 'all')  # all, following
    
    telegram_id = str(request.telegram_user.get('id'))
    current_user_result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    current_user_id = current_user_result.data[0]['id']
    
    query = supabase.table('exams').select('*, users!inner(*), universities(*), courses(*)')
    
    if university_id:
        query = query.eq('university_id', university_id)
    if course_id:
        query = query.eq('course_id', course_id)
    if year:
        query = query.eq('year', year)
    if user_id:
        query = query.eq('user_id', user_id)
    
    if feed_type == 'following':
        # Get users that current user follows
        follows = supabase.table('follows').select('following_id').eq('follower_id', current_user_id).execute()
        following_ids = [f['following_id'] for f in follows.data]
        if following_ids:
            query = query.in_('user_id', following_ids)
        else:
            return jsonify({'exams': []})
    
    result = query.order('created_at', desc=True).execute()
    exams = result.data
    
    # Filter by search if provided
    if search:
        search_lower = search.lower()
        exams = [e for e in exams if 
                 search_lower in e.get('courses', {}).get('name', '').lower() or
                 search_lower in e.get('users', {}).get('username', '').lower()]
    
    # Get files for each exam
    for exam in exams:
        files = supabase.table('exam_files').select('*').eq('exam_id', exam['id']).order('page_order').execute()
        exam['files'] = files.data
        
        # Check if user liked this exam
        likes = supabase.table('exam_likes').select('*').eq('exam_id', exam['id']).eq('user_id', current_user_id).execute()
        exam['is_liked'] = len(likes.data) > 0
        
        # Get like count
        like_count = supabase.table('exam_likes').select('*').eq('exam_id', exam['id']).execute()
        exam['likes_count'] = len(like_count.data)
    
    return jsonify({'exams': exams})

@app.route('/api/exams/<exam_id>', methods=['GET'])
@require_auth
def get_exam(exam_id):
    """Get single exam details"""
    result = supabase.table('exams').select('*, users!inner(*), universities(*), courses(*)').eq('id', exam_id).execute()
    
    if not result.data:
        return jsonify({'error': 'Exam not found'}), 404
    
    exam = result.data[0]
    
    # Get files
    files = supabase.table('exam_files').select('*').eq('exam_id', exam_id).order('page_order').execute()
    exam['files'] = files.data
    
    # Get like info
    telegram_id = str(request.telegram_user.get('id'))
    current_user_result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    current_user_id = current_user_result.data[0]['id']
    
    likes = supabase.table('exam_likes').select('*').eq('exam_id', exam_id).eq('user_id', current_user_id).execute()
    exam['is_liked'] = len(likes.data) > 0
    
    like_count = supabase.table('exam_likes').select('*').eq('exam_id', exam_id).execute()
    exam['likes_count'] = len(like_count.data)
    
    return jsonify({'exam': exam})

@app.route('/api/exams', methods=['POST'])
@require_auth
def create_exam():
    """Create a new exam"""
    data = request.json
    telegram_id = str(request.telegram_user.get('id'))
    
    result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    user_id = result.data[0]['id']
    
    # Validate required fields
    required = ['university_id', 'course_id', 'year', 'exam_type', 'files']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Create exam
    exam = {
        'id': str(uuid.uuid4()),
        'user_id': user_id,
        'university_id': data['university_id'],
        'course_id': data['course_id'],
        'year': data['year'],
        'exam_type': data['exam_type'],
        'teacher_name': data.get('teacher_name', ''),
        'created_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('exams').insert(exam).execute()
    exam_data = result.data[0]
    
    # Create exam files
    for i, file_url in enumerate(data['files']):
        file_data = {
            'id': str(uuid.uuid4()),
            'exam_id': exam_data['id'],
            'file_url': file_url,
            'page_order': i
        }
        supabase.table('exam_files').insert(file_data).execute()
    
    return jsonify({'exam': exam_data, 'success': True})

@app.route('/api/exams/<exam_id>/like', methods=['POST'])
@require_auth
def like_exam(exam_id):
    """Like an exam"""
    telegram_id = str(request.telegram_user.get('id'))
    result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    user_id = result.data[0]['id']
    
    # Check if already liked
    existing = supabase.table('exam_likes').select('*').eq('exam_id', exam_id).eq('user_id', user_id).execute()
    if existing.data:
        return jsonify({'success': True, 'message': 'Already liked'})
    
    like_data = {
        'id': str(uuid.uuid4()),
        'exam_id': exam_id,
        'user_id': user_id,
        'created_at': datetime.utcnow().isoformat()
    }
    supabase.table('exam_likes').insert(like_data).execute()
    
    return jsonify({'success': True})

@app.route('/api/exams/<exam_id>/like', methods=['DELETE'])
@require_auth
def unlike_exam(exam_id):
    """Unlike an exam"""
    telegram_id = str(request.telegram_user.get('id'))
    result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    user_id = result.data[0]['id']
    
    supabase.table('exam_likes').delete().eq('exam_id', exam_id).eq('user_id', user_id).execute()
    
    return jsonify({'success': True})

# ============== UPLOAD ENDPOINTS ==============

@app.route('/api/upload/url', methods=['POST'])
@require_auth
def get_upload_url():
    """Get signed URL for file upload"""
    data = request.json
    filename = data.get('filename', f"{uuid.uuid4()}.pdf")
    content_type = data.get('content_type', 'application/pdf')
    
    # Generate unique filename
    unique_filename = f"{datetime.utcnow().strftime('%Y/%m')}/{uuid.uuid4()}_{filename}"
    
    try:
        # Get signed URL from Supabase Storage
        result = supabase.storage.from_('exams').create_signed_upload_url(unique_filename)
        
        return jsonify({
            'signed_url': result['signedURL'],
            'path': unique_filename,
            'token': result['token']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload/confirm', methods=['POST'])
@require_auth
def confirm_upload():
    """Confirm upload and get public URL"""
    data = request.json
    path = data.get('path')
    
    if not path:
        return jsonify({'error': 'Path is required'}), 400
    
    try:
        # Get public URL
        result = supabase.storage.from_('exams').get_public_url(path)
        return jsonify({'url': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ============== REPORT ENDPOINTS ==============

@app.route('/api/reports', methods=['POST'])
@require_auth
def create_report():
    """Create a report"""
    data = request.json
    telegram_id = str(request.telegram_user.get('id'))
    
    result = supabase.table('users').select('id').eq('telegram_id', telegram_id).execute()
    reporter_id = result.data[0]['id']
    
    required = ['report_type', 'reported_id', 'reason']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    report = {
        'id': str(uuid.uuid4()),
        'reporter_id': reporter_id,
        'report_type': data['report_type'],  # 'exam' or 'user'
        'reported_id': data['reported_id'],
        'reason': data['reason'],
        'status': 'pending',
        'created_at': datetime.utcnow().isoformat()
    }
    
    result = supabase.table('reports').insert(report).execute()
    
    # Check if content should be auto-hidden
    check_auto_hide(data['report_type'], data['reported_id'])
    
    return jsonify({'report': result.data[0], 'success': True})

def check_auto_hide(report_type, reported_id):
    """Auto-hide content if it reaches report threshold"""
    # Get report count
    reports = supabase.table('reports').select('*').eq('report_type', report_type).eq('reported_id', reported_id).eq('status', 'pending').execute()
    
    if len(reports.data) >= 3:  # Threshold
        if report_type == 'exam':
            supabase.table('exams').update({'is_hidden': True}).eq('id', reported_id).execute()
        # Could also ban users

# ============== HEALTH CHECK ==============

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'})

# Vercel handler
@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'FetenaHub API - Telegram Mini App for Exam Sharing'})

# For local development
if __name__ == '__main__':
    app.run(debug=True, port=5000)
