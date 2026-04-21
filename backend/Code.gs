const SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_HERE';
const TOKEN_TTL_SECONDS = 21600;

const SHEETS = {
  Users: ['user_id', 'full_name', 'email', 'password_hash', 'role', 'status', 'created_at'],
  Students: ['student_id', 'user_id', 'student_number', 'section', 'year_level'],
  Teachers: ['teacher_id', 'user_id', 'department'],
  Classes: ['class_id', 'teacher_id', 'class_name', 'school_year', 'section'],
  Enrollments: ['enrollment_id', 'class_id', 'student_id'],
  Assignments: ['assignment_id', 'class_id', 'title', 'description', 'due_date', 'status'],
  Announcements: ['announcement_id', 'class_id', 'teacher_id', 'title', 'content', 'date_posted'],
  Grades: ['grade_id', 'student_id', 'class_id', 'assignment_id', 'score', 'remarks', 'date_recorded'],
  CalendarEvents: ['event_id', 'class_id', 'title', 'event_date', 'event_type'],
  Messages: ['message_id', 'sender_user_id', 'receiver_user_id', 'message_body', 'sent_at']
};

function doGet(e) {
  return handleRequest_('GET', e);
}

function doPost(e) {
  return handleRequest_('POST', e);
}

function handleRequest_(method, e) {
  try {
    const payload = parsePayload_(method, e);
    const action = payload.action;
    if (!action) return jsonResponse_(false, 'Missing action.');

    const handlers = {
      registerTeacher,
      registerStudent,
      loginUser,
      addStudent,
      createAnnouncement,
      createAssignment,
      assignGrade,
      getTeacherDashboardData,
      getClassStudents,
      getStudentDashboardData,
      getAssignments,
      getAnnouncements,
      getGrades,
      getCalendarEvents,
      getMessages,
      sendMessage
    };

    if (!handlers[action]) return jsonResponse_(false, 'Invalid action.');
    const result = handlers[action](payload);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return jsonResponse_(false, err.message || 'Unexpected server error.');
  }
}

function parsePayload_(method, e) {
  if (method === 'GET') return e.parameter || {};
  if (e && e.parameter && Object.keys(e.parameter).length) return e.parameter;
  if (!e.postData || !e.postData.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return e.parameter || {};
  }
}

function jsonResponse_(success, message, data) {
  return ContentService.createTextOutput(JSON.stringify({ success, message, data: data || null }))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowIso_() {
  return new Date().toISOString();
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheetRows_(name) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name);
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

function appendRow_(name, rowObj) {
  const sheet = getSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Missing sheet: ' + name);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => rowObj[h] || '');
  sheet.appendRow(row);
}

function generateId_(prefix) {
  return prefix + '_' + Utilities.getUuid().split('-')[0];
}

function hashPassword_(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(digest);
}

function requireFields_(obj, fields) {
  fields.forEach(f => {
    if (!obj[f] || String(obj[f]).trim() === '') throw new Error('Missing required field: ' + f);
  });
}

function setSessionToken_(sessionData) {
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put('token_' + token, JSON.stringify(sessionData), TOKEN_TTL_SECONDS);
  return token;
}

function getSessionByToken_(token) {
  if (!token) throw new Error('Missing token.');
  const raw = CacheService.getScriptCache().get('token_' + token);
  if (!raw) throw new Error('Session expired. Please log in again.');
  return JSON.parse(raw);
}

function requireTeacher_(token) {
  const session = getSessionByToken_(token);
  if (session.role !== 'teacher') throw new Error('Teacher role required.');
  return session;
}

function requireStudent_(token) {
  const session = getSessionByToken_(token);
  if (session.role !== 'student') throw new Error('Student role required.');
  return session;
}

function findBy_(arr, key, value) {
  return arr.find(x => String(x[key]).toLowerCase() === String(value).toLowerCase());
}

function registerTeacher(payload) {
  requireFields_(payload, ['full_name', 'email', 'password', 'department']);
  const users = getSheetRows_('Users');
  if (findBy_(users, 'email', payload.email)) return { success: false, message: 'Email already registered.' };

  const userId = generateId_('usr');
  const teacherId = generateId_('tch');

  appendRow_('Users', {
    user_id: userId,
    full_name: payload.full_name,
    email: payload.email.toLowerCase(),
    password_hash: hashPassword_(payload.password),
    role: 'teacher',
    status: 'active',
    created_at: nowIso_()
  });

  appendRow_('Teachers', {
    teacher_id: teacherId,
    user_id: userId,
    department: payload.department
  });

  const classId = generateId_('cls');
  appendRow_('Classes', {
    class_id: classId,
    teacher_id: teacherId,
    class_name: payload.class_name || 'Default Class',
    school_year: payload.school_year || '2026-2027',
    section: payload.section || 'A'
  });

  return { success: true, message: 'Teacher registered.' };
}

function registerStudent(payload) {
  requireFields_(payload, ['full_name', 'email', 'password', 'student_number', 'section', 'year_level']);
  const users = getSheetRows_('Users');
  if (findBy_(users, 'email', payload.email)) return { success: false, message: 'Email already registered.' };

  const userId = generateId_('usr');
  const studentId = generateId_('std');

  appendRow_('Users', {
    user_id: userId,
    full_name: payload.full_name,
    email: payload.email.toLowerCase(),
    password_hash: hashPassword_(payload.password),
    role: 'student',
    status: 'active',
    created_at: nowIso_()
  });

  appendRow_('Students', {
    student_id: studentId,
    user_id: userId,
    student_number: payload.student_number,
    section: payload.section,
    year_level: payload.year_level
  });

  return { success: true, message: 'Student registered.' };
}

function loginUser(payload) {
  requireFields_(payload, ['email', 'password']);
  const users = getSheetRows_('Users');
  const user = findBy_(users, 'email', payload.email.toLowerCase());
  if (!user) return { success: false, message: 'Invalid credentials.' };

  const hashedInput = hashPassword_(payload.password);
  if (hashedInput !== user.password_hash) return { success: false, message: 'Invalid credentials.' };
  if (user.status !== 'active') return { success: false, message: 'Account not active.' };

  const session = {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role
  };

  if (user.role === 'teacher') {
    const teachers = getSheetRows_('Teachers');
    const classes = getSheetRows_('Classes');
    const teacher = teachers.find(t => t.user_id === user.user_id);
    const teacherClass = classes.find(c => c.teacher_id === teacher.teacher_id);
    session.teacher_id = teacher.teacher_id;
    session.class_id = teacherClass ? teacherClass.class_id : '';
  }

  if (user.role === 'student') {
    const students = getSheetRows_('Students');
    const enrollments = getSheetRows_('Enrollments');
    const student = students.find(s => s.user_id === user.user_id);
    const enrollment = enrollments.find(e => e.student_id === student.student_id);
    session.student_id = student.student_id;
    session.class_id = enrollment ? enrollment.class_id : '';
  }

  session.token = setSessionToken_(session);
  return { success: true, message: 'Login successful.', user: session };
}

function addStudent(payload) {
  const teacher = getTeacherContext_(payload);
  requireFields_(payload, ['full_name', 'email', 'password', 'student_number', 'section', 'year_level', 'class_id']);

  const registration = registerStudent(payload);
  if (!registration.success) return registration;

  const users = getSheetRows_('Users');
  const students = getSheetRows_('Students');
  const createdUser = findBy_(users, 'email', payload.email.toLowerCase());
  const createdStudent = students.find(s => s.user_id === createdUser.user_id);

  appendRow_('Enrollments', {
    enrollment_id: generateId_('enr'),
    class_id: payload.class_id,
    student_id: createdStudent.student_id
  });

  appendRow_('Messages', {
    message_id: generateId_('msg'),
    sender_user_id: teacher.user_id,
    receiver_user_id: createdUser.user_id,
    message_body: 'Welcome to EduLMS. You have been added to the class.',
    sent_at: nowIso_()
  });

  return { success: true, message: 'Student added and enrolled.' };
}

function createAnnouncement(payload) {
  const teacher = getTeacherContext_(payload);
  requireFields_(payload, ['class_id', 'title', 'content']);
  appendRow_('Announcements', {
    announcement_id: generateId_('ann'),
    class_id: payload.class_id,
    teacher_id: teacher.teacher_id,
    title: payload.title,
    content: payload.content,
    date_posted: nowIso_()
  });
  return { success: true, message: 'Announcement posted.' };
}

function createAssignment(payload) {
  getTeacherContext_(payload);
  requireFields_(payload, ['class_id', 'title', 'description', 'due_date', 'status']);
  appendRow_('Assignments', {
    assignment_id: generateId_('asg'),
    class_id: payload.class_id,
    title: payload.title,
    description: payload.description,
    due_date: payload.due_date,
    status: payload.status
  });

  appendRow_('CalendarEvents', {
    event_id: generateId_('evt'),
    class_id: payload.class_id,
    title: payload.title,
    event_date: payload.due_date,
    event_type: 'Assignment Due'
  });

  return { success: true, message: 'Assignment created.' };
}

function assignGrade(payload) {
  getTeacherContext_(payload);
  requireFields_(payload, ['student_id', 'class_id', 'assignment_id', 'score', 'remarks']);
  appendRow_('Grades', {
    grade_id: generateId_('grd'),
    student_id: payload.student_id,
    class_id: payload.class_id,
    assignment_id: payload.assignment_id,
    score: payload.score,
    remarks: payload.remarks,
    date_recorded: nowIso_()
  });
  return { success: true, message: 'Grade assigned.' };
}

function getTeacherDashboardData(payload) {
  const teacher = getTeacherContext_(payload);

  const classes = getSheetRows_('Classes').filter(c => c.teacher_id === teacher.teacher_id);
  const classIds = classes.map(c => c.class_id);
  const assignments = getSheetRows_('Assignments').filter(a => classIds.includes(a.class_id));
  const announcements = getSheetRows_('Announcements').filter(a => classIds.includes(a.class_id));
  const grades = getSheetRows_('Grades').filter(g => classIds.includes(g.class_id));

  return {
    success: true,
    message: 'Dashboard data loaded.',
    summary: {
      total_classes: classes.length,
      total_assignments: assignments.length,
      total_announcements: announcements.length,
      total_grades: grades.length
    },
    classes
  };
}

function getClassStudents(payload) {
  requireFields_(payload, ['teacher_user_id', 'class_id']);
  const teacher = getTeacherByUserId_(payload.teacher_user_id);
  const classes = getSheetRows_('Classes');
  const ownedClass = classes.find(c => c.class_id === payload.class_id && c.teacher_id === teacher.teacher_id);
  if (!ownedClass) return { success: false, message: 'Class not found or not owned by teacher.' };

  const enrollments = getSheetRows_('Enrollments').filter(e => e.class_id === payload.class_id);
  const students = getSheetRows_('Students');
  const users = getSheetRows_('Users');

  const studentMap = enrollments.map(e => {
    const student = students.find(s => s.student_id === e.student_id);
    const user = student ? users.find(u => u.user_id === student.user_id) : null;
    if (!student || !user) return null;
    return {
      student_id: student.student_id,
      full_name: user.full_name,
      student_number: student.student_number,
      section: student.section,
      year_level: student.year_level
    };
  }).filter(Boolean);

  return { success: true, message: 'Class students loaded.', students: studentMap };
}

function getStudentDashboardData(payload) {
  const studentSession = requireStudent_(payload.token);
  const classId = payload.class_id || studentSession.class_id;
  if (!classId) return { success: true, message: 'No class enrolled.', data: { assignments: [], announcements: [], grades: [], calendar: [], messages: [] } };

  const assignments = getSheetRows_('Assignments').filter(a => a.class_id === classId);
  const announcements = getSheetRows_('Announcements').filter(a => a.class_id === classId);
  const grades = getSheetRows_('Grades').filter(g => g.class_id === classId && g.student_id === studentSession.student_id).map(g => {
    const assignment = assignments.find(a => a.assignment_id === g.assignment_id);
    return { ...g, assignment_title: assignment ? assignment.title : g.assignment_id };
  });
  const calendar = getSheetRows_('CalendarEvents').filter(c => c.class_id === classId);
  const messages = buildUserMessages_(studentSession.user_id);

  return {
    success: true,
    message: 'Student dashboard loaded.',
    data: { assignments, announcements, grades, calendar, messages }
  };
}

function getAssignments(payload) {
  requireFields_(payload, ['class_id']);
  return { success: true, message: 'Assignments loaded.', assignments: getSheetRows_('Assignments').filter(a => a.class_id === payload.class_id) };
}

function getAnnouncements(payload) {
  requireFields_(payload, ['class_id']);
  return { success: true, message: 'Announcements loaded.', announcements: getSheetRows_('Announcements').filter(a => a.class_id === payload.class_id) };
}

function getGrades(payload) {
  getSessionByToken_(payload.token);
  requireFields_(payload, ['class_id']);
  const grades = getSheetRows_('Grades').filter(g => g.class_id === payload.class_id);
  return { success: true, message: 'Grades loaded.', data: grades };
}

function getCalendarEvents(payload) {
  requireFields_(payload, ['class_id']);
  const events = getSheetRows_('CalendarEvents').filter(c => c.class_id === payload.class_id);
  return { success: true, message: 'Calendar loaded.', calendar: events };
}

function getMessages(payload) {
  const session = getSessionByToken_(payload.token);
  return { success: true, message: 'Messages loaded.', data: buildUserMessages_(session.user_id) };
}

function sendMessage(payload) {
  const session = getSessionByToken_(payload.token);
  requireFields_(payload, ['receiver_user_id', 'message_body']);
  appendRow_('Messages', {
    message_id: generateId_('msg'),
    sender_user_id: session.user_id,
    receiver_user_id: payload.receiver_user_id,
    message_body: payload.message_body,
    sent_at: nowIso_()
  });
  return { success: true, message: 'Message sent.' };
}

function buildUserMessages_(userId) {
  const users = getSheetRows_('Users');
  return getSheetRows_('Messages')
    .filter(m => m.sender_user_id === userId || m.receiver_user_id === userId)
    .map(m => {
      const sender = users.find(u => u.user_id === m.sender_user_id);
      return {
        ...m,
        sender_name: sender ? sender.full_name : m.sender_user_id
      };
    })
    .sort((a, b) => String(b.sent_at).localeCompare(String(a.sent_at)))
    .slice(0, 20);
}

function getTeacherByUserId_(teacherUserId) {
  const teachers = getSheetRows_('Teachers');
  const teacher = teachers.find(t => t.user_id === teacherUserId);
  if (!teacher) throw new Error('Teacher account not found.');
  return teacher;
}

function getTeacherContext_(payload) {
  if (payload.teacher_user_id) return getTeacherByUserId_(payload.teacher_user_id);
  if (payload.token) return requireTeacher_(payload.token);
  throw new Error('Missing teacher_user_id.');
}
