const teacherSession = getSessionOrRedirect('teacher');
if (teacherSession) {
  bindDashboardShell();
  document.getElementById('teacher-name').textContent = teacherSession.full_name;
  initializeTeacherDashboard(teacherSession);
}

async function initializeTeacherDashboard(session) {
  await loadTeacherDashboardData(session);
  bindTeacherForms(session);
}

async function loadTeacherDashboardData(session) {
  try {
    const dashboard = await apiRequest('getTeacherDashboardData', { user_id: session.user_id }, 'GET');
    const { students, assignments, announcements, grades, calendar_events } = dashboard.data;

    renderSummaryCards('teacher-summary-cards', [
      { label: 'Students', value: students.length },
      { label: 'Assignments', value: assignments.length },
      { label: 'Announcements', value: announcements.length },
      { label: 'Grades Submitted', value: grades.length }
    ]);

    document.getElementById('student-table-body').innerHTML = students.length
      ? students.map((s) => `<tr><td>${s.full_name}</td><td>${s.student_number}</td><td>${s.section}</td><td>${s.year_level}</td></tr>`).join('')
      : '<tr><td colspan="4">No students found.</td></tr>';

    renderStackList('assignment-list', assignments, (a) => `<li><strong>${a.title}</strong><br>${a.description}<br>Due: ${a.due_date} | ${a.status}</li>`);
    renderStackList('announcement-list', announcements, (a) => `<li><strong>${a.title}</strong><br>${a.content}<br>Posted: ${a.date_posted}</li>`);
    renderStackList('grade-list', grades, (g) => `<li>Student ${g.student_id} | Assignment ${g.assignment_id} | Score: ${g.score} (${g.remarks})</li>`);
    renderStackList('calendar-list', calendar_events, (c) => `<li><strong>${c.title}</strong><br>${c.event_date} (${c.event_type})</li>`);
  } catch (error) {
    setMessage('add-student-message', error.message, true);
  }
}

function bindTeacherForms(session) {
  bindForm('add-student-form', 'addStudent', 'add-student-message', session);
  bindForm('create-assignment-form', 'createAssignment', 'assignment-message', session);
  bindForm('announcement-form', 'createAnnouncement', 'announcement-message', session);
  bindForm('grade-form', 'assignGrade', 'grade-message', session);
}

function bindForm(formId, action, messageId, session) {
  document.getElementById(formId)?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.user_id = session.user_id;

    try {
      await apiRequest(action, payload);
      setMessage(messageId, 'Saved successfully.');
      event.currentTarget.reset();
      await loadTeacherDashboardData(session);
    } catch (error) {
      setMessage(messageId, error.message, true);
    }
  });
}
