import sqlite3
import os
from passlib.context import CryptContext

db_path = 'c:/Users/aryam/career_guidance/career_guidance.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('SELECT user_id FROM users WHERE user_id = ?', ('AMAL K',))
    rows = c.fetchall()
    
    pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    new_hash = pwd_context.hash('1234')
    
    if len(rows) > 0:
        c.execute('UPDATE users SET hashed_password = ? WHERE user_id = ?', (new_hash, 'AMAL K'))
        conn.commit()
        print('SUCCESS: Reset AMAL K password to 1234')
    else:
        print('User AMAL K does not exist')
