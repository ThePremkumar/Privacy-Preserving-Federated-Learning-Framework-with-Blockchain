import sqlite3, glob, os

dbs = glob.glob('**/*.db', recursive=True) + glob.glob('*.db')
print('DB files found:', dbs)
for db in dbs:
    try:
        conn = sqlite3.connect(db)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r[0] for r in cur.fetchall()]
        print(f'\n[{db}] Tables: {tables}')
        if 'users' in tables:
            cur.execute('SELECT username, role, is_active FROM users LIMIT 20')
            rows = cur.fetchall()
            print('  Users:')
            for r in rows:
                print(f'    {r[0]} | {r[1]} | active={r[2]}')
        conn.close()
    except Exception as e:
        print(f'  Error reading {db}: {e}')
