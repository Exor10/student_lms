# Seed Data (CSV blocks)

Copy each block into its corresponding Google Sheet below the header row.

## Users
```csv
user_id,full_name,email,password_hash,role,status,created_at
USR-teacher-0001,Ana Villanueva,ana.villanueva@edulms.edu,8f2be4ef37d2b00f9481644e7f08f37f70bf7d98ce3070ff8016866e7f08de81,teacher,active,2026-04-20T08:00:00.000Z
USR-student-0001,Noah Santiago,noah.santiago@edulms.edu,95f698f3f20f27f429ca8f89f30a0f971a4e241ccb146b29bda858f315f8332b,student,active,2026-04-20T08:10:00.000Z
USR-student-0002,Mia Gonzales,mia.gonzales@edulms.edu,d2f8f6050f7dbf9057c9bb587f8eb7be6907decd58f6fb7f752fc3d5f8d26ab6,student,active,2026-04-20T08:20:00.000Z
```

## Teachers
```csv
teacher_id,user_id,department
TCH-0001,USR-teacher-0001,Science
```

## Students
```csv
student_id,user_id,student_number,section,year_level
STD-0001,USR-student-0001,2026-1001,STEM-11A,11
STD-0002,USR-student-0002,2026-1002,STEM-11A,11
```

## Classes
```csv
class_id,teacher_id,class_name,school_year,section
CLS-0001,TCH-0001,General Chemistry,2026-2027,STEM-11A
```

## Enrollments
```csv
enrollment_id,class_id,student_id
ENR-0001,CLS-0001,STD-0001
ENR-0002,CLS-0001,STD-0002
```

## Assignments
```csv
assignment_id,class_id,title,description,due_date,status
ASM-0001,CLS-0001,Laboratory Safety Quiz,Complete the safety quiz before lab,2026-05-01,Open
ASM-0002,CLS-0001,Periodic Table Worksheet,Solve all worksheet items,2026-05-05,Open
```

## Announcements
```csv
announcement_id,class_id,teacher_id,title,content,date_posted
ANN-0001,CLS-0001,TCH-0001,Welcome to Chemistry,Please prepare your notebook and lab coat,2026-04-20T10:00:00.000Z
ANN-0002,CLS-0001,TCH-0001,Quiz Reminder,Lab safety quiz closes on May 1,2026-04-21T09:00:00.000Z
```

## Grades
```csv
grade_id,student_id,class_id,assignment_id,score,remarks,date_recorded
GRD-0001,STD-0001,CLS-0001,ASM-0001,92,Excellent,2026-04-21T11:30:00.000Z
GRD-0002,STD-0002,CLS-0001,ASM-0001,88,Good work,2026-04-21T11:35:00.000Z
```

## CalendarEvents
```csv
event_id,class_id,title,event_date,event_type
EVT-0001,CLS-0001,Laboratory Safety Quiz due,2026-05-01,assignment_deadline
EVT-0002,CLS-0001,Class Consultation,2026-04-28,class_event
```

## Messages
```csv
message_id,sender_user_id,receiver_user_id,message_body,sent_at
MSG-0001,USR-student-0001,USR-teacher-0001,Can I submit the worksheet as PDF?,2026-04-21T12:00:00.000Z
MSG-0002,USR-teacher-0001,USR-student-0001,Yes, PDF submissions are accepted.,2026-04-21T12:05:00.000Z
```
