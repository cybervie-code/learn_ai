# Cybervie — AI Learning & Cybersecurity Platform

> Understand AI. Use it intelligently. Secure it responsibly. Prove what you know.

A B2B2C SaaS platform for Indian B.Tech colleges that helps students understand AI deeply, use it responsibly, learn cybersecurity fundamentals, demonstrate competency through quizzes, and build credible public profiles.

Built with the **MERN stack** (MongoDB, Express, React, Node.js).

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (running locally or via MongoDB Atlas)

### 1. Backend

```bash
cd backend
cp .env.example .env       # edit credentials if needed
npm install
npm run seed               # loads sample college, users, questions, paths
npm run dev                # starts on http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                # starts on http://localhost:5173
```

### 3. Open the app

Visit http://localhost:5173

---

## Demo Credentials

After running `npm run seed` in the backend:

| Role            | Email                          | Password        |
|-----------------|--------------------------------|-----------------|
| Superadmin      | admin@cybervie.in              | ChangeMe123!    |
| College Admin   | admin@demo.iitd.ac.in          | Admin123!       |
| Faculty         | faculty@demo.iitd.ac.in        | Faculty123!     |
| Student         | student1@demo.iitd.ac.in       | Student123!     |

Verified college domain: `demo.iitd.ac.in`

---

## Project Structure

```
Cybervie Collage/
├── backend/
│   ├── src/
│   │   ├── config/          # DB and env config
│   │   ├── models/          # Mongoose schemas (User, College, Quiz, Question, Attempt, etc.)
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/           # Express route definitions
│   │   ├── middleware/      # auth, roles, errorHandler
│   │   ├── services/        # authService (Google OAuth, JWT)
│   │   └── utils/           # ApiError, sendResponse, asyncHandler
│   ├── seed/                # Database seed script
│   ├── server.js            # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios client + API helpers
│   │   ├── components/      # Layout (Sidebar, DashboardLayout, PublicLayout)
│   │   ├── context/         # AuthContext
│   │   └── pages/
│   │       ├── public/      # Home, Login, About, PublicPaths, PublicRankings
│   │       ├── student/     # Dashboard, Learn, MissionDetail, QuizPlayer, Rankings, Profile, Assignments, Practice
│   │       └── admin/       # AdminDashboard, Colleges, Questions, Users
│   ├── index.html
│   └── package.json
└── README.md
```

---

## Core Features

### Authentication & Multi-tenancy
- Google OAuth ID-token verification (server-side, validates `sub`, `hd`, `email_verified`)
- Email/password login for platform staff (superadmin, content authors)
- JWT-based sessions
- Multi-tenant: each college is a tenant with verified domains
- Server-side RBAC: `superadmin`, `college-admin`, `faculty`, `student`
- Tenant isolation: queries filtered by `college` from authenticated identity

### Learning
- Learning Paths → Missions → Quiz structure
- Content blocks (headings, text, callouts, images)
- Quiz-first mastery learning with immediate feedback
- Question versioning (immutable snapshots in attempts)
- Randomized question and option ordering
- Correct answers never exposed before submission

### Quiz Engine
- Start attempt → immutable question snapshots
- Submit answer (per-question feedback in learning mode)
- Submit attempt → server-side scoring
- XP awards for correct answers
- Question analytics (attempt counts, correct rates)
- Review screen with explanations

### Rankings
- Global student leaderboard (XP-based)
- College leaderboard (aggregate XP)
- Privacy-respecting: non-public profiles shown as anonymous
- Streak tracking

### Profiles
- Public/private toggle (DPDP consent model)
- Competency scores, badges, recent activity
- Public profile viewable by anyone when opted-in

### Administration
- **Superadmin**: college CRUD, domain verification, question bank, user management
- **College Admin**: user management, assignments
- **Faculty**: create assignments, view results
- Question editorial workflow: draft → review → approved → published → retired

### Security
- Helmet security headers
- CORS allowlist
- Rate limiting (300 req / 15 min per IP)
- Input validation on all routes
- Audit logging for admin actions
- Tenant isolation enforced server-side
- Correct answers hidden in assessment mode

---

## API Overview

| Method | Endpoint                          | Description                       |
|--------|-----------------------------------|-----------------------------------|
| POST   | `/api/auth/google`                | Google OAuth login                |
| POST   | `/api/auth/login`                 | Email/password login             |
| POST   | `/api/auth/register`              | Email/password register          |
| GET    | `/api/auth/me`                    | Current user                     |
| GET    | `/api/paths`                      | List learning paths               |
| GET    | `/api/paths/:slug`                | Path detail with missions         |
| GET    | `/api/paths/mission/:slug`        | Mission detail                    |
| GET    | `/api/quizzes`                    | List quizzes                      |
| POST   | `/api/attempts/start`            | Start a quiz attempt              |
| POST   | `/api/attempts/:id/answer`        | Submit one answer                 |
| POST   | `/api/attempts/:id/submit`        | Finalize attempt                  |
| GET    | `/api/attempts/me`                | My attempt history                |
| GET    | `/api/rankings/global`           | Global leaderboard                |
| GET    | `/api/rankings/college-leaderboard` | College leaderboard            |
| GET    | `/api/profiles/me`               | My profile                        |
| PUT    | `/api/profiles/me`               | Update my profile                 |
| GET    | `/api/assignments`               | List assignments                  |
| POST   | `/api/assignments`               | Create assignment (faculty)      |
| GET    | `/api/colleges`                   | List colleges (superadmin)       |
| POST   | `/api/colleges`                   | Create college                    |
| POST   | `/api/colleges/:id/domains`       | Add domain                        |
| POST   | `/api/colleges/:id/domains/verify` | Verify domain                    |
| GET    | `/api/questions`                  | List questions                    |
| POST   | `/api/questions`                  | Create question                   |
| PATCH  | `/api/questions/:id/status`       | Update question status            |
| GET    | `/api/users/all`                  | List all users (superadmin)      |
| GET    | `/api/users/college`              | List college users (admin)       |

Full interactive docs available at `/health` for status check.

---

## Environment Variables

### Backend (`backend/.env`)
```
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/cybervie
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=                          # optional for dev
SUPERADMIN_EMAIL=admin@cybervie.in
SUPERADMIN_PASSWORD=ChangeMe123!
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=                     # optional for dev
```

---

## Tech Stack

- **MongoDB** — document database
- **Express** — Node.js web framework
- **React 18** — UI library
- **Node.js** — JavaScript runtime
- **Vite** — frontend build tool
- **Tailwind CSS** — styling
- **React Router** — client routing
- **Axios** — HTTP client
- **JWT** — authentication tokens
- **Helmet** — security headers
- **Morgan** — HTTP logging

---

## Known Limitations (MVP)

- Google OAuth uses claim extraction without full JWKS signature verification (set `GOOGLE_CLIENT_ID` to enable issuer/audience checks; full JWKS verification should be added before production)
- No refresh token rotation (single JWT with 7-day expiry)
- No spaced repetition scheduler yet
- No proctored/summative assessment mode
- No file upload for profile pictures (avatar URL only)
- No real-time notifications (polling not implemented)
- No automated tests yet (manual verification only)
- No deployment configuration (Docker/Kubernetes)
- Legal compliance (DPDP, CERT-In) requires validation by Indian counsel before production

---

## Production Checklist

Before deploying to production:
1. Set strong `JWT_SECRET` and rotate
2. Configure real Google OAuth credentials
3. Implement JWKS signature verification for Google ID tokens
4. Add refresh token rotation
5. Set up MongoDB Atlas or managed MongoDB with backups
6. Configure CORS allowlist to production domain
7. Add automated tests (Jest + Supertest for backend, Vitest for frontend)
8. Set up CI/CD pipeline
9. Validate DPDP Act 2023 compliance with legal counsel
10. Add rate limiting per user (not just per IP)
11. Implement audit log retention policy
12. Add data export/deletion workflows for DPDP compliance

---

## License

Proprietary. © 2026 Cybervie.
