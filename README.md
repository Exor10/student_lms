# EduLMS (Google Sheets + Google Apps Script)

EduLMS is a complete LMS web application prototype with separate teacher and student authentication, role-based dashboards, and Google Sheets-backed data via Google Apps Script.

## Project Structure

```
student_lms/
├── backend/
│   └── Code.gs
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── dashboard-common.js
│   │   ├── register.js
│   │   ├── student-dashboard.js
│   │   └── teacher-dashboard.js
│   └── pages/
│       ├── register.html
│       ├── student-dashboard.html
│       └── teacher-dashboard.html
└── scripts/
    └── seed-data.csv.md
```

## Features

### Authentication
- Register as teacher or student.
- Login using email + password.
- Passwords are SHA-256 hashed before storage.
- Session state is kept in `sessionStorage` (non-persistent browser session only).

### Teacher Dashboard
- Summary cards.
- Student master list table.
- Add student form.
- Create/manage assignments.
- Post announcements.
- Assign grades.
- Calendar overview.

### Student Dashboard
- Summary cards.
- Upcoming assignments.
- Announcement feed.
- Grades table.
- Calendar panel.
- Message teacher panel.

## Google Sheets Database Design

Create one spreadsheet with the following sheet names and exact header rows in row 1:

1. `Users`
   - `user_id,full_name,email,password_hash,role,status,created_at`
2. `Students`
   - `student_id,user_id,student_number,section,year_level`
3. `Teachers`
   - `teacher_id,user_id,department`
4. `Classes`
   - `class_id,teacher_id,class_name,school_year,section`
5. `Enrollments`
   - `enrollment_id,class_id,student_id`
6. `Assignments`
   - `assignment_id,class_id,title,description,due_date,status`
7. `Announcements`
   - `announcement_id,class_id,teacher_id,title,content,date_posted`
8. `Grades`
   - `grade_id,student_id,class_id,assignment_id,score,remarks,date_recorded`
9. `CalendarEvents`
   - `event_id,class_id,title,event_date,event_type`
10. `Messages`
    - `message_id,sender_user_id,receiver_user_id,message_body,sent_at`

## Backend Setup (Google Apps Script)

1. Open [script.google.com](https://script.google.com).
2. Create a new Apps Script project.
3. Copy the content of `backend/Code.gs` into your script project.
4. Update `SPREADSHEET_ID` at the top of `Code.gs`.
5. Deploy:
   - **Deploy > New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone with the link** (or your preferred restricted mode if frontend is secured)
6. Copy the deployed Web App URL.

## Frontend Setup

1. Open `frontend/js/config.js`.
2. Replace `PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE` with your deployed Apps Script URL.
3. Host `frontend/` using any static host:
   - VS Code Live Server
   - GitHub Pages
   - Netlify
   - Cloudflare Pages

## Example API Usage

### Register Teacher

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"registerTeacher",
    "full_name":"Marian Dela Cruz",
    "email":"marian.teacher@school.edu",
    "password":"TeachPass123!",
    "department":"Mathematics"
  }'
```

### Register Student

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"registerStudent",
    "full_name":"Liam Ramos",
    "email":"liam.student@school.edu",
    "password":"StudPass123!",
    "student_number":"2026-0012",
    "section":"STEM-11A",
    "year_level":"11"
  }'
```

### Login

```bash
curl -X POST "YOUR_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{"action":"loginUser","email":"liam.student@school.edu","password":"StudPass123!"}'
```

### Teacher Dashboard Data

```bash
curl "YOUR_WEB_APP_URL?action=getTeacherDashboardData&user_id=USR-EXAMPLE"
```

### Student Dashboard Data

```bash
curl "YOUR_WEB_APP_URL?action=getStudentDashboardData&user_id=USR-EXAMPLE"
```

## Notes on Security

- Do not make your spreadsheet public.
- Keep all data access in Apps Script only.
- Only hashed passwords are stored (`password_hash` column).
- Teacher-only actions (`addStudent`, `createAssignment`, `createAnnouncement`, `assignGrade`) enforce role checks server-side.
- Required fields are validated before writes.

## Seed Data

Use the sample records in `scripts/seed-data.csv.md` to populate initial rows.
