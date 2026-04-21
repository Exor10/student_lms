# EduLMS Apps Script API Usage

Base URL:

```text
https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

## Login

```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"loginUser",
    "email":"maria.teacher@edulms.edu",
    "password":"TeacherPass#2026"
  }'
```

## Register Teacher

```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"registerTeacher",
    "full_name":"Rico Santos",
    "email":"rico.santos@edulms.edu",
    "password":"StrongPass#123",
    "department":"Mathematics",
    "class_name":"Math 8 - Section A",
    "school_year":"2026-2027",
    "section":"A"
  }'
```

## Register Student

```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"registerStudent",
    "full_name":"Luna Reyes",
    "email":"luna.reyes@edulms.edu",
    "password":"StudentPass#123",
    "student_number":"2026-0042",
    "section":"A",
    "year_level":"8"
  }'
```

## Teacher: Create Assignment

```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"createAssignment",
    "token":"TEACHER_SESSION_TOKEN",
    "class_id":"cls_1001",
    "title":"Algebra Worksheet 1",
    "description":"Solve items 1-20 on linear equations.",
    "due_date":"2026-05-10",
    "status":"Open"
  }'
```

## Teacher: Create Announcement

```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"createAnnouncement",
    "token":"TEACHER_SESSION_TOKEN",
    "class_id":"cls_1001",
    "title":"Quiz Reminder",
    "content":"Bring your calculator on Friday."
  }'
```

## Teacher: Assign Grade

```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"assignGrade",
    "token":"TEACHER_SESSION_TOKEN",
    "student_id":"std_1001",
    "class_id":"cls_1001",
    "assignment_id":"asg_1001",
    "score":"95",
    "remarks":"Excellent work"
  }'
```

## Student: Get Dashboard Data

```bash
curl "$API_URL?action=getStudentDashboardData&token=STUDENT_SESSION_TOKEN&student_id=std_1001&class_id=cls_1001"
```

## Messaging

```bash
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "action":"sendMessage",
    "token":"STUDENT_SESSION_TOKEN",
    "receiver_user_id":"usr_1001",
    "message_body":"Can I submit by Friday afternoon?"
  }'
```
