# Vyaya - Personal Expense & Income Tracker

A production-ready MERN stack application for tracking personal expenses, income, budgets, and savings goals.

## Tech Stack

- **Frontend**: React, React Bootstrap, React Router, Axios, Recharts, Context API
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT, Passport (Google OAuth), bcrypt
- **Database**: MongoDB Atlas (cloud sync across devices)

## Features

- Email/Password & Google OAuth authentication
- Dashboard with income, planned spending, savings, expenses, remaining balance
- Expense management with categories
- Category-wise and month-over-month analytics
- Budget monitoring with alerts
- Savings goals with motivational feedback
- PDF and Excel report export

## Setup

### 1. Environment Variables

**Backend** (`server/.env`):
- Copy `server/.env.example` to `server/.env`
- Set `MONGODB_URI` (MongoDB Atlas connection string)
- Set `JWT_SECRET` (random secure string)
- For Google OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- Set `CLIENT_URL` (e.g. `http://localhost:3000` for dev)

**Frontend** (`client/.env`):
- `VITE_API_URL` - Leave empty for dev (uses proxy). For production, set backend URL.

### 2. Install & Run

```bash
# Backend
cd server
npm install
npm run dev

# Frontend (in new terminal)
cd client
npm install
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### 3. MongoDB Atlas

1. Create a cluster at https://cloud.mongodb.com
2. Get connection string and add to `MONGODB_URI`
3. Whitelist your IP (or 0.0.0.0/0 for development)

### 4. Google OAuth (Optional)

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect: `http://localhost:5000/api/auth/google/callback`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

## Critical Business Rule

**Sum of category budgets ≤ Planned spending**

Enforced on:
- Frontend (Setup, Profile)
- Backend (auth/setup, users/financial)
- Mongoose User model pre-save

## Deployment

- **Frontend**: Vercel
- **Backend**: Render
- **Database**: MongoDB Atlas

Update `CLIENT_URL` and `GOOGLE_CALLBACK_URL` for production domains.
"# Vyaya" 
