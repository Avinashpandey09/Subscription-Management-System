# Subscription Management System

Full-stack subscription management application with a React/Vite frontend and
FastAPI/PostgreSQL backend.

## Team setup

### 1. Configure the backend

```powershell
cd server
copy .env.example .env
```

Update `server/.env` with the PostgreSQL connection string and a private
`JWT_SECRET_KEY`. Do not commit `.env` or share its secrets.

### 2. Install dependencies

```powershell
cd server
.\venv\Scripts\python.exe -m pip install -r requirements.txt

cd ..\client
npm install
```

### 3. Create demo users

Run this against the team's configured PostgreSQL database:

```powershell
cd server
.\venv\Scripts\python.exe seed_demo.py
```

The script is safe to rerun. It creates or updates these users:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@demo.example.com` | `Demo@1234` |
| Staff | `staff@demo.example.com` | `Demo@1234` |
| Customer | `customer@demo.example.com` | `Demo@1234` |

These are shared development credentials only. Change them before any
non-development deployment.

### 4. Start the API and frontend

Terminal 1:

```powershell
cd server
.\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Terminal 2:

```powershell
cd client
npm run dev
```

Open <http://localhost:5173>. FastAPI Swagger documentation is available at
<http://localhost:8000/docs>.

## Authentication test flow

1. Open `/signup` and register a customer account.
2. Confirm that registration redirects to the customer portal.
3. Log out and log back in at `/login`.
4. Verify the protected session at `/api/auth/me`.
5. Log in as `admin@demo.example.com` to access admin staff management.
6. Use `/forgot-password` and read the development reset link from the API
   console.

Authentication uses Argon2 password hashing and a JWT stored in an httpOnly
cookie. Customer registration always creates the `customer` role; only an
authenticated admin can create staff accounts.

## Current API routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/admin/staff`
- `POST /api/admin/staff`
- `DELETE /api/admin/staff/{user_id}`

## Validation

```powershell
cd client
npm run build

cd ..\server
.\venv\Scripts\python.exe -m compileall main.py config models schemas router
```
