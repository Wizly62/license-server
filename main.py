
from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
DB_FILE = 'licenses.db'

def init_db():
    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS licenses (
                hwid TEXT PRIMARY KEY,
                key TEXT NOT NULL,
                expiry TEXT NOT NULL
            )
        """)
        conn.commit()

@app.route('/check', methods=['POST'])
def check_license():
    data = request.json
    hwid = data.get('hwid')
    key = data.get('key')

    if not hwid or not key:
        return jsonify({'status': 'error', 'message': 'Missing HWID or key'}), 400

    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('SELECT key, expiry FROM licenses WHERE hwid = ?', (hwid,))
        row = cursor.fetchone()

        if not row:
            return jsonify({'status': 'not_found'}), 404

        db_key, expiry = row
        try:
            expiry_time = datetime.strptime(expiry, '%d.%m.%Y %H:%M')
        except:
            return jsonify({'status': 'error', 'message': 'Invalid expiry format'}), 500

        if key != db_key:
            return jsonify({'status': 'invalid'}), 403

        if expiry_time < datetime.now():
            return jsonify({'status': 'expired'}), 200

        return jsonify({'status': 'ok', 'expires': expiry}), 200

@app.route('/add', methods=['POST'])
def add_license():
    data = request.json
    hwid = data.get('hwid')
    key = data.get('key')
    expiry = data.get('expiry')

    if not hwid or not key or not expiry:
        return jsonify({'status': 'error', 'message': 'Missing fields'}), 400

    with sqlite3.connect(DB_FILE) as conn:
        cursor = conn.cursor()
        cursor.execute('REPLACE INTO licenses (hwid, key, expiry) VALUES (?, ?, ?)', (hwid, key, expiry))
        conn.commit()

    return jsonify({'status': 'added'}), 200

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
