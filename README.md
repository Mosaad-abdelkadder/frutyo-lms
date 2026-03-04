# LMS Frutyo (Students + Tutors + Admin + Razorpay)

A full-stack LMS starter built with MERN:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Payments: Razorpay (UPI, Credit Card, Debit Card, Netbanking, Wallets depending on Razorpay checkout settings)

## Roadmap (Feature-by-Feature Plan)

1. Foundation (completed)
- Authentication (JWT)
- Role-based access: Admin, Student, Tutor
- Course and chapter models
- Enrollment model with progress + points
- Leaderboard data
- Razorpay order creation and payment verification
- Seeded sample users/courses/chapters/enrollments in MongoDB

2. Core Learning Flow (next)
- Course detail pages with richer chapter content player
- Quiz and assignment module
- Certificates and completion milestones

3. Tutor Workspace
- Tutor course/chapter creation UI
- Enrollment analytics per course
- Student progress breakdown per chapter

4. Admin Control Center
- User/course moderation
- Platform analytics with date filters
- Payout/revenue reports

5. Engagement Layer
- Announcements, Q&A, discussion threads
- Badges and streaks
- Email/WhatsApp notifications

6. Production Hardening
- Test suite (unit + integration)
- Rate limiting + audit logs
- CI/CD + monitoring + backups

## Current Implemented Features

- Auth
  - Register/Login
  - Protected API routes with role checks

- Roles
  - Admin dashboard stats: users/courses/enrollments/revenue
  - Tutor dashboard overview: course count, enrollments, revenue, avg progress
  - Student dashboard: enrollments, average progress, points, leaderboard

- LMS Entities
  - Users (`admin`, `student`, `tutor`)
  - Courses
  - Chapters
  - Enrollments

- Progress Tracking
  - Student can mark chapters complete
  - Progress percentage auto-calculated
  - Points auto-calculated

- Leaderboard
  - Global top students based on total points and average progress

- Razorpay
  - Create order from backend
  - Verify signature from backend
  - Fetch payment details from Razorpay API during verification (status/order/amount checks)
  - Free-course auto enrollment
  - Mock mode fallback when Razorpay keys are not set (for local testing)

- Complete CRUD with RBAC
  - Users: Admin can create/read/update/delete users
  - Courses: Admin/Tutor create/read/update/delete with ownership checks
  - Chapters: Admin/Tutor create/read/update/delete inside managed courses
  - Enrollments: Student/Admin read + update/delete via role constraints

- Upgraded Product UI
  - Public landing page
  - Student-friendly course catalog and learning views
  - Tutor/Admin Course Studio for full course + chapter management
  - Admin Studio for user and enrollment management
  - Mobile-first responsive UI with animated sections
  - PWA support (manifest + service worker + installable app shell)

## Project Structure

- `server/` Express backend, MongoDB models, seed script
- `client/` React frontend

## Setup (Windows 11 + PowerShell)

### 1. Install dependencies
```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Configure environment

Backend:
```bash
copy server\.env.example server\.env
```

Frontend:
```bash
copy client\.env.example client\.env
```

Update `server/.env`:
- `MONGODB_URI` (local or Atlas)
- `JWT_SECRET`
- `CLIENT_URL`
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (optional for real payments)

### 3. Seed actual MongoDB data
```bash
npm run seed
```

### 4. Run full stack
```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Sample Seeded Accounts

- Admin: `admin@lms.com` / `Admin@123`
- Tutor: `tutor1@lms.com` / `Tutor@123`
- Student: `student1@lms.com` / `Student@123`

## Key API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/courses`
- `GET /api/courses/:courseId`
- `GET /api/courses/mine`
- `PUT /api/courses/:courseId`
- `DELETE /api/courses/:courseId`
- `GET /api/courses/:courseId/chapters`
- `POST /api/courses/:courseId/chapters`
- `PUT /api/courses/:courseId/chapters/:chapterId`
- `DELETE /api/courses/:courseId/chapters/:chapterId`
- `POST /api/payments/create-order`
- `POST /api/payments/verify`
- `GET /api/payments/config`
- `GET /api/enrollments/my`
- `GET /api/enrollments`
- `GET /api/enrollments/:enrollmentId`
- `POST /api/enrollments/:courseId/progress`
- `PATCH /api/enrollments/:enrollmentId`
- `DELETE /api/enrollments/:enrollmentId`
- `GET /api/enrollments/leaderboard/global`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:userId`
- `DELETE /api/admin/users/:userId`

## Razorpay Notes

- UPI/card/debit options are controlled by Razorpay Checkout and account configuration.
- For production, always use real keys and webhook-based payment reconciliation.
- Current project verifies checkout signature server-side on `/api/payments/verify`.

### Razorpay Test Account Validation
1. Add your test keys in `server/.env`:
   - `RAZORPAY_KEY_ID=rzp_test_xxx`
   - `RAZORPAY_KEY_SECRET=...`
2. Restart backend.
3. Login as student, open Courses page, verify `Razorpay Mode` shows `live_or_test`.
4. Enroll in a paid course and complete a payment with Razorpay test UPI/card data.
5. Confirm enrollment appears in My Learning and Admin Studio.

## CloudPanel Deployment (Node.js Site)

CloudPanel target: [Create Node.js Site](https://demo.cloudpanel.io/site/new/nodejs)

### Backend
1. Create Node.js site in CloudPanel for backend (domain/subdomain).
2. Upload/pull repo on server.
3. Set app root to `server/`.
4. Configure environment variables from `server/.env`.
5. Install dependencies:
```bash
npm install --production
```
6. Start command:
```bash
npm run start
```

### Frontend
1. Build locally or on server:
```bash
npm run build --prefix client
```
2. Serve `client/dist` via CloudPanel static site (Nginx) OR a separate frontend Node site.
3. Set `VITE_API_URL` to backend public URL before building.

## WSL2 / Linux Notes

You can run the same commands inside WSL2 Ubuntu, AlmaLinux, or Alpine shells.
Use Linux-style paths and ensure MongoDB is reachable from that environment.

## Validation Performed

- `npm run build` in `client` passed
- `npm run lint` in `client` passed
- `node --check` on backend source passed

Note: `npm run seed` and full runtime were not executed in this session because MongoDB service availability depends on your local environment.
# frutyo-lms
