# EduLMS Prototype (Google Sheets + Apps Script)

EduLMS is a student project LMS prototype with separate teacher and student authentication, role-based dashboards, and Google Sheets as the database through a Google Apps Script web app API.

## Project Structure

```text
student_lms/
├── docs/
│   ├── index.html
│   ├── register.html
│   ├── teacher-dashboard.html
│   ├── student-dashboard.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       ├── auth.js
│       ├── login.js
│       ├── register.js
│       ├── teacher-dashboard.js
│       └── student-dashboard.js
└── backend/
    ├── Code.gs
    ├── seed_data.csv
    └── APIS.md
```

## 1) Google Sheets Setup

Create one spreadsheet and add these sheets exactly:

- Users
- Students
- Teachers
- Classes
- Enrollments
- Assignments
- Announcements
- Grades
- CalendarEvents
- Messages

Paste these headers in row 1 of each sheet:

- **Users**: `user_id, full_name, email, password_hash, role, status, created_at`
- **Students**: `student_id, user_id, student_number, section, year_level`
- **Teachers**: `teacher_id, user_id, department`
- **Classes**: `class_id, teacher_id, class_name, school_year, section`
- **Enrollments**: `enrollment_id, class_id, student_id`
- **Assignments**: `assignment_id, class_id, title, description, due_date, status`
- **Announcements**: `announcement_id, class_id, teacher_id, title, content, date_posted`
- **Grades**: `grade_id, student_id, class_id, assignment_id, score, remarks, date_recorded`
- **CalendarEvents**: `event_id, class_id, title, event_date, event_type`
- **Messages**: `message_id, sender_user_id, receiver_user_id, message_body, sent_at`

## 2) Apps Script Backend Setup

1. Open [script.google.com](https://script.google.com) and create a project.
2. Copy `backend/Code.gs` into the default script file.
3. Set `SPREADSHEET_ID` in `Code.gs` to your spreadsheet ID.
4. Save project.
5. Deploy as **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone** (recommended for testing from a static frontend like GitHub Pages), or **Anyone with Google account** if your testers are signed in.
6. Copy the deployed web app URL.

## 3) Frontend ↔ Backend Contract

1. Open `docs/js/config.js`.
2. Set `API_BASE_URL` to your deployed Apps Script `/exec` URL:

```js
API_BASE_URL: 'https://script.google.com/macros/s/AKfycbwT_0ghAP7d9MkgTTHtZtbnYN7vUg9_dGpGqOBm6yP2_50agQWyQNjlel6fPo8ntTc/exec'
```

3. If you redeploy Apps Script later, update `docs/js/config.js` with the new `/exec` URL.
4. Serve `docs` as static files (VS Code Live Server, Python `http.server`, GitHub Pages, or any static host).
5. Current dashboard responses are summary-first:
   - Teacher dashboard: `success`, `summary`, `classes` (detailed arrays may be absent)
   - Student dashboard: `success`, `summary` (detailed arrays may be absent)

## 4) Seed Data

Use `backend/seed_data.csv` to copy sample rows into each sheet after headers.

## 5) Security Notes

- Passwords are hashed (SHA-256) before saving.
- No direct Google Sheet public access is used by frontend.
- Role checks are enforced for teacher-only actions.
- Required fields are validated on backend before writes.
- Frontend stores only session token in `sessionStorage` (not persistent database data).

## 6) Feature Coverage

### Teacher
- Register / login
- Dashboard summary cards
- Student master list
- Add students
- Create assignments
- Post announcements
- Assign grades
- Calendar overview

### Student
- Register / login
- Dashboard summary cards
- View assignments
- View announcements
- View grades
- View calendar events
- Message teacher (optional feature included)

## 7) API examples

See `backend/APIS.md` for request/response examples.
