const SPREADSHEET_ID = '1uY6XbOMebkDK-G26TKV4-qAgDqv0yfg16h2EuttlX6U';
const SHEETS = {
  USERS: 'Users',
  STUDENTS: 'Students',
  TEACHERS: 'Teachers',
  CLASSES: 'Classes',
  ENROLLMENTS: 'Enrollments',
  ASSIGNMENTS: 'Assignments',
  ANNOUNCEMENTS: 'Announcements',
  GRADES: 'Grades',
  CALENDAR_EVENTS: 'CalendarEvents',
  MESSAGES: 'Messages'
};

function doGet(e) {
  return handleRequest(e.parameter || {}, 'GET');
}

function doPost(e) {
  let payload = {};
  if (e.postData && e.postData.contents) {
    payload = JSON.parse(e.postData.contents);
  }
  return handleRequest(payload, 'POST');
}

function handleRequest(params) {
  try {
    const action = params.action;
    if (!action) return jsonResponse(false, 'Missing action parameter');

    const routes = {
      registerTeacher,
      registerStudent,
      loginUser,
      addStudent,
      createAnnouncement,
      createAssignment,
      assignGrade,
      getTeacherDashboardData,
      getStudentDashboardData,
      getAssignments,
      getAnnouncements,
      getGrades,
      getCalendarEvents,
      getMessages,
      sendMessage
    };

    if (!routes[action]) return jsonResponse(false, 'Unknown action: ' + action);
    const result = routes[action](params);
    return jsonResponse(true, 'OK', result || {});
  } catch (err) {
    return jsonResponse(false, err.message || 'Unexpected server error');
  }
}

function registerTeacher(data) {
  validateRequired(data, ['full_name', 'email', 'password', 'department']);
  ensureEmailAvailable(data.email);

  const userId = generateId('USR');
  const teacherId = generateId('TCH');
  const usersSheet = getSheet(SHEETS.USERS);
  const teachersSheet = getSheet(SHEETS.TEACHERS);

  usersSheet.appendRow([userId, data.full_name, data.email.toLowerCase(), hashPassword(data.password), 'teacher', 'active', nowISO()]);
  teachersSheet.appendRow([teacherId, userId, data.department]);

  return { user_id: userId, teacher_id: teacherId };
}

function registerStudent(data) {
  validateRequired(data, ['full_name', 'email', 'password', 'student_number', 'section', 'year_level']);
  ensureEmailAvailable(data.email);

  const userId = generateId('USR');
  const studentId = generateId('STD');
  const usersSheet = getSheet(SHEETS.USERS);
  const studentsSheet = getSheet(SHEETS.STUDENTS);

  usersSheet.appendRow([userId, data.full_name, data.email.toLowerCase(), hashPassword(data.password), 'student', 'active', nowISO()]);
  studentsSheet.appendRow([studentId, userId, data.student_number, data.section, data.year_level]);

  return { user_id: userId, student_id: studentId };
}

function loginUser(data) {
  validateRequired(data, ['email', 'password']);
  const users = getRecords(SHEETS.USERS);
  const user = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase() && u.status === 'active');
  if (!user) throw new Error('Invalid credentials');
  if (user.password_hash !== hashPassword(data.password)) throw new Error('Invalid credentials');

  return {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    status: user.status
  };
}

function addStudent(data) {
  validateRequired(data, ['user_id', 'full_name', 'email', 'student_number', 'section', 'year_level']);
  enforceRole(data.user_id, 'teacher');

  ensureEmailAvailable(data.email);
  const userId = generateId('USR');
  const studentId = generateId('STD');
  getSheet(SHEETS.USERS).appendRow([userId, data.full_name, data.email.toLowerCase(), hashPassword('ChangeMe123!'), 'student', 'active', nowISO()]);
  getSheet(SHEETS.STUDENTS).appendRow([studentId, userId, data.student_number, data.section, data.year_level]);

  return { student_id: studentId, temporary_password_notice: 'Default temporary password assigned.' };
}

function createAnnouncement(data) {
  validateRequired(data, ['user_id', 'class_id', 'title', 'content']);
  enforceRole(data.user_id, 'teacher');

  const teacher = getRecords(SHEETS.TEACHERS).find((t) => t.user_id === data.user_id);
  if (!teacher) throw new Error('Teacher record not found');

  const announcementId = generateId('ANN');
  getSheet(SHEETS.ANNOUNCEMENTS).appendRow([
    announcementId,
    data.class_id,
    teacher.teacher_id,
    data.title,
    data.content,
    nowISO()
  ]);

  return { announcement_id: announcementId };
}

function createAssignment(data) {
  validateRequired(data, ['user_id', 'class_id', 'title', 'description', 'due_date', 'status']);
  enforceRole(data.user_id, 'teacher');

  const assignmentId = generateId('ASM');
  getSheet(SHEETS.ASSIGNMENTS).appendRow([
    assignmentId,
    data.class_id,
    data.title,
    data.description,
    data.due_date,
    data.status
  ]);

  createCalendarEventInternal(data.class_id, data.title + ' due', data.due_date, 'assignment_deadline');
  return { assignment_id: assignmentId };
}

function assignGrade(data) {
  validateRequired(data, ['user_id', 'student_id', 'class_id', 'assignment_id', 'score', 'remarks']);
  enforceRole(data.user_id, 'teacher');

  const gradeId = generateId('GRD');
  getSheet(SHEETS.GRADES).appendRow([
    gradeId,
    data.student_id,
    data.class_id,
    data.assignment_id,
    data.score,
    data.remarks,
    nowISO()
  ]);

  return { grade_id: gradeId };
}

function getTeacherDashboardData(data) {
  validateRequired(data, ['user_id']);
  enforceRole(data.user_id, 'teacher');

  return {
    students: joinStudentsWithUsers(),
    assignments: getRecords(SHEETS.ASSIGNMENTS),
    announcements: getRecords(SHEETS.ANNOUNCEMENTS),
    grades: getRecords(SHEETS.GRADES),
    calendar_events: getRecords(SHEETS.CALENDAR_EVENTS)
  };
}

function getStudentDashboardData(data) {
  validateRequired(data, ['user_id']);
  enforceRole(data.user_id, 'student');

  const student = getRecords(SHEETS.STUDENTS).find((s) => s.user_id === data.user_id);
  if (!student) throw new Error('Student not found');

  return {
    assignments: getAssignments(data),
    announcements: getAnnouncements(data),
    grades: getGrades({ student_id: student.student_id, user_id: data.user_id }),
    calendar_events: getCalendarEvents(data),
    messages: getMessages({ user_id: data.user_id })
  };
}

function getAssignments(data) {
  validateRequired(data, ['user_id']);
  enforceRole(data.user_id, 'student');
  return getRecords(SHEETS.ASSIGNMENTS).filter((a) => a.status === 'Open');
}

function getAnnouncements(data) {
  validateRequired(data, ['user_id']);
  enforceRole(data.user_id, 'student');
  return getRecords(SHEETS.ANNOUNCEMENTS);
}

function getGrades(data) {
  validateRequired(data, ['user_id']);
  const role = getUserRole(data.user_id);

  if (role === 'student') {
    const student = getRecords(SHEETS.STUDENTS).find((s) => s.user_id === data.user_id);
    if (!student) return [];
    return getRecords(SHEETS.GRADES).filter((g) => g.student_id === student.student_id);
  }

  if (role === 'teacher') {
    return getRecords(SHEETS.GRADES);
  }

  throw new Error('Unauthorized grade access');
}

function getCalendarEvents(data) {
  validateRequired(data, ['user_id']);
  if (!['student', 'teacher'].includes(getUserRole(data.user_id))) {
    throw new Error('Unauthorized calendar access');
  }
  return getRecords(SHEETS.CALENDAR_EVENTS);
}

function sendMessage(data) {
  validateRequired(data, ['sender_user_id', 'receiver_user_id', 'message_body']);
  if (!getUserById(data.sender_user_id) || !getUserById(data.receiver_user_id)) {
    throw new Error('Invalid sender/receiver');
  }

  const messageId = generateId('MSG');
  getSheet(SHEETS.MESSAGES).appendRow([
    messageId,
    data.sender_user_id,
    data.receiver_user_id,
    data.message_body,
    nowISO()
  ]);

  return { message_id: messageId };
}

function getMessages(data) {
  validateRequired(data, ['user_id']);
  return getRecords(SHEETS.MESSAGES).filter((m) => m.sender_user_id === data.user_id || m.receiver_user_id === data.user_id);
}

function createCalendarEventInternal(classId, title, eventDate, eventType) {
  const eventId = generateId('EVT');
  getSheet(SHEETS.CALENDAR_EVENTS).appendRow([eventId, classId, title, eventDate, eventType]);
}

function getSheet(name) {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
}

function getRecords(sheetName) {
  const sheet = getSheet(sheetName);
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values[0];

  return values.slice(1).filter((row) => row.join('') !== '').map((row) => {
    const record = {};
    headers.forEach((header, i) => {
      record[String(header).trim()] = row[i];
    });
    return record;
  });
}

function joinStudentsWithUsers() {
  const students = getRecords(SHEETS.STUDENTS);
  const users = getRecords(SHEETS.USERS);
  return students.map((s) => {
    const user = users.find((u) => u.user_id === s.user_id) || {};
    return Object.assign({}, s, { full_name: user.full_name || '' });
  });
}

function jsonResponse(success, message, data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success, message, data: data || null }))
    .setMimeType(ContentService.MimeType.JSON);
}

function validateRequired(data, requiredFields) {
  requiredFields.forEach((field) => {
    if (!String(data[field] || '').trim()) throw new Error('Missing required field: ' + field);
  });
}

function ensureEmailAvailable(email) {
  const users = getRecords(SHEETS.USERS);
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('Email already exists');
  }
}

function getUserById(userId) {
  return getRecords(SHEETS.USERS).find((u) => u.user_id === userId);
}

function getUserRole(userId) {
  const user = getUserById(userId);
  if (!user) throw new Error('User not found');
  return user.role;
}

function enforceRole(userId, allowedRole) {
  const role = getUserRole(userId);
  if (role !== allowedRole) throw new Error('Unauthorized action for role: ' + role);
}

function hashPassword(password) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return bytes.map((b) => (('0' + (b & 0xff).toString(16)).slice(-2))).join('');
}

function generateId(prefix) {
  return prefix + '-' + Utilities.getUuid().split('-')[0] + '-' + new Date().getTime();
}

function nowISO() {
  return new Date().toISOString();
}
