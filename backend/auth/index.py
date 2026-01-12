import json
import os
import hashlib
import secrets
from datetime import datetime, timedelta
import psycopg2

def handler(event: dict, context) -> dict:
    """API для регистрации, входа и проверки авторизации пользователей"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'register':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                name = body.get('name', '').strip()
                
                if not email or not password or not name:
                    return response(400, {'error': 'Все поля обязательны'})
                
                if len(password) < 6:
                    return response(400, {'error': 'Пароль должен быть не менее 6 символов'})
                
                cur.execute("SELECT id FROM t_p66030129_mental_health_app_1.users WHERE email = %s", (email,))
                if cur.fetchone():
                    return response(400, {'error': 'Пользователь с таким email уже существует'})
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cur.execute(
                    "INSERT INTO t_p66030129_mental_health_app_1.users (email, password_hash, name) VALUES (%s, %s, %s) RETURNING id",
                    (email, password_hash, name)
                )
                user_id = cur.fetchone()[0]
                conn.commit()
                
                session_token = secrets.token_urlsafe(32)
                expires_at = datetime.now() + timedelta(days=30)
                
                cur.execute(
                    "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                    (user_id, session_token, expires_at)
                )
                conn.commit()
                
                return response(200, {
                    'success': True,
                    'session_token': session_token,
                    'user': {'id': user_id, 'email': email, 'name': name}
                })
            
            elif action == 'login':
                email = body.get('email', '').strip().lower()
                password = body.get('password', '')
                
                if not email or not password:
                    return response(400, {'error': 'Email и пароль обязательны'})
                
                password_hash = hashlib.sha256(password.encode()).hexdigest()
                
                cur.execute(
                    "SELECT id, email, name FROM t_p66030129_mental_health_app_1.users WHERE email = %s AND password_hash = %s",
                    (email, password_hash)
                )
                user = cur.fetchone()
                
                if not user:
                    return response(401, {'error': 'Неверный email или пароль'})
                
                user_id, user_email, user_name = user
                
                session_token = secrets.token_urlsafe(32)
                expires_at = datetime.now() + timedelta(days=30)
                
                cur.execute(
                    "INSERT INTO t_p66030129_mental_health_app_1.sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                    (user_id, session_token, expires_at)
                )
                conn.commit()
                
                return response(200, {
                    'success': True,
                    'session_token': session_token,
                    'user': {'id': user_id, 'email': user_email, 'name': user_name}
                })
            
            elif action == 'logout':
                session_token = event.get('headers', {}).get('X-Session-Token', '')
                
                if session_token:
                    cur.execute("UPDATE t_p66030129_mental_health_app_1.sessions SET expires_at = NOW() WHERE token = %s", (session_token,))
                    conn.commit()
                
                return response(200, {'success': True})
        
        elif method == 'GET':
            session_token = event.get('headers', {}).get('x-session-token', '')
            
            if not session_token:
                return response(401, {'error': 'Не авторизован'})
            
            cur.execute("""
                SELECT u.id, u.email, u.name, s.expires_at
                FROM t_p66030129_mental_health_app_1.users u
                JOIN t_p66030129_mental_health_app_1.sessions s ON u.id = s.user_id
                WHERE s.token = %s
            """, (session_token,))
            
            result = cur.fetchone()
            
            if not result:
                return response(401, {'error': 'Сессия не найдена'})
            
            user_id, email, name, expires_at = result
            
            if expires_at < datetime.now():
                return response(401, {'error': 'Сессия истекла'})
            
            return response(200, {
                'user': {'id': user_id, 'email': email, 'name': name}
            })
        
        return response(405, {'error': 'Метод не поддерживается'})
        
    except Exception as e:
        return response(500, {'error': str(e)})
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def response(status_code: int, data: dict) -> dict:
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(data, ensure_ascii=False),
        'isBase64Encoded': False
    }