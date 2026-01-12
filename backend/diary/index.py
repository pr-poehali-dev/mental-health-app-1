import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    """
    API для работы с дневником эмоций.
    Поддерживает создание, получение и обновление записей дневника.
    """
    method = event.get('httpMethod') or event.get('method', 'GET')
    method = str(method).upper()
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration error'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    try:
        headers = event.get('headers', {})
        if not isinstance(headers, dict):
            headers = {}
        user_id = str(headers.get('X-User-Id', '1'))
        
        if method == 'GET':
            cursor.execute("""
                SELECT id, mood, entry_text, created_at 
                FROM diary_entries 
                WHERE user_id = %s 
                ORDER BY created_at DESC 
                LIMIT 20
            """, (user_id,))
            
            entries = []
            for row in cursor.fetchall():
                entries.append({
                    'id': row[0],
                    'mood': row[1],
                    'text': row[2],
                    'date': row[3].strftime('%d %B')
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'entries': entries}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = event.get('body', '{}')
            
            if isinstance(body_data, dict):
                body = body_data
            elif isinstance(body_data, str):
                try:
                    body = json.loads(body_data) if body_data.strip() else {}
                except (json.JSONDecodeError, ValueError, AttributeError):
                    body = {}
            else:
                body = {}
            
            mood = body.get('mood') if isinstance(body, dict) else None
            text = body.get('text', '') if isinstance(body, dict) else ''
            
            if not mood or mood not in ['happy', 'calm', 'anxious', 'sad', 'stressed']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid mood value'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                INSERT INTO diary_entries (user_id, mood, entry_text, created_at)
                VALUES (%s, %s, %s, %s)
                RETURNING id, created_at
            """, (user_id, mood, text, datetime.now()))
            
            result = cursor.fetchone()
            
            cursor.execute("""
                INSERT INTO user_progress (user_id, diary_count, updated_at)
                VALUES (%s::integer, 1, %s)
                ON CONFLICT (user_id) 
                DO UPDATE SET 
                    diary_count = user_progress.diary_count + 1,
                    updated_at = %s
            """, (int(user_id), datetime.now(), datetime.now()))
            
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'id': result[0],
                    'date': result[1].strftime('%d %B')
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cursor.close()
        conn.close()