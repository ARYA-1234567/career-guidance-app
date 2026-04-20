import sqlite3
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['pbkdf2_sha256'], deprecated='auto')

conn = sqlite3.connect('c:/Users/aryam/career_guidance/career_guidance.db')
c = conn.cursor()
c.execute('SELECT hashed_password FROM users WHERE user_id = ?', ('AMAL K',))
row = c.fetchone()
print('Hash:', row[0])
try:
    print('Verify:', pwd_context.verify('1234', row[0]))
except Exception as e:
    import traceback
    traceback.print_exc()
