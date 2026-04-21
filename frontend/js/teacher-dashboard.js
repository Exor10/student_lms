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
    const dashboard = await apiRequest(
      'getTeacherDashboardData',
      { teacher_user_id: session.user_id },
      'GET'
    );

    if (!dashboard.success) {
      throw new Error(dashboard.message || 'Failed to load dashboard.');
    }

    const summary = dashboard.summary || {};
    const classes = dashboard.classes || [];

    renderSummaryCards('teacher-summary-cards', [
      { label: 'Classes', value: summary.total_classes || 0 },
      { label: 'Assignments', value: summary.total_assignments || 0 },
      { label: 'Announcements', value: summary.total_announcements || 0 },
      { label: 'Grades Submitted', value: summary.total_grades || 0 }
    ]);

    document.getElementById('student-table-body').innerHTML =
      '<tr><td colspan="4">Student list is not returned by the current Apps Script dashboard endpoint yet.</td></tr>';

    renderStackList(
      'assignment-list',
      [],
      (a) => `<li><strong>${a.title}</strong><br>${a.description}<br>Due: ${a.due_date} | ${a.status}</li>`,
      'Assignments are not returned by the current dashboard endpoint yet.'
    );

    renderStackList(
      'announcement-list',
      [],
      (a) => `<li><strong>${a.title}</strong><br>${a.content}<br>Posted: ${a.date_posted}</li>`,
      'Announcements are not returned by the current dashboard endpoint yet.'
    );

    renderStackList(
      'grade-list',
      [],
      (g) => `<li>Student ${g.student_id} | Assignment ${g.assignment_id} | Score: ${g.score} (${g.remarks})</li>`,
      'Grades are not returned by the current dashboard endpoint yet.'
    );

    renderStackList(
      'calendar-list',
      classes,
      (c) => `<li><strong>${c.class_name || 'Untitled Class'}</strong><br>Class ID: ${c.class_id}</li>`,
      'No classes found.'
    );
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
    payload.teacher_user_id = session.user_id;

    try {
      const result = await apiRequest(action, payload);

      if (!result.success) {
        throw new Error(result.message || 'Request failed.');
      }

      setMessage(messageId, 'Saved successfully.');
      event.currentTarget.reset();
      await loadTeacherDashboardData(session);
    } catch (error) {
      setMessage(messageId, error.message, true);
    }
  });
}
