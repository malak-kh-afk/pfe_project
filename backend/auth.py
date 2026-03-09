# auth.py
import sqlite3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import hashlib

router = APIRouter()

DB = "infra.db"

# ---------------------------
# Helpers
# ---------------------------
def hash_pw(p: str) -> str:
    """Simple hash for passwords."""
    return hashlib.sha256(("pepper-" + p).encode()).hexdigest()

def db():
    return sqlite3.connect(DB)

# ---------------------------
# DB INIT
# ---------------------------
def init_auth():
    conn = db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT
        )
    """)
    conn.commit()
    conn.close()

# ---------------------------
# Models
# ---------------------------
class Creds(BaseModel):
    email: EmailStr
    password: str

# ---------------------------
# ROUTES
# ---------------------------

@router.post("/auth/register")
def register(creds: Creds):
    conn = db(); c = conn.cursor()

    hashed = hash_pw(creds.password)

    try:
        c.execute(
            "INSERT INTO users (email, password_hash) VALUES (?,?)",
            (creds.email, hashed)
        )
        conn.commit()
        return {"user_id": c.lastrowid, "name": creds.email}
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Email already registered")
    finally:
        conn.close()


@router.post("/auth/login")
def login(creds: Creds):
    conn = db(); c = conn.cursor()
    c.execute("SELECT id, password_hash, name FROM users WHERE email=?", (creds.email,))
    row = c.fetchone()
    conn.close()

    if not row:
        raise HTTPException(401, "Invalid email or password")

    user_id, stored_hash, name = row

    if stored_hash != hash_pw(creds.password):
        raise HTTPException(401, "Invalid email or password")

    return {"user_id": user_id, "name": name or creds.email}

