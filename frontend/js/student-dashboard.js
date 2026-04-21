const studentSession = getSessionOrRedirect('student');

if (studentSession) {
  bindDashboardShell();
  document.getElementById('student-name').textContent = studentSession.full_name;
  initializeStudentDashboard(studentSession);
}

async function initializeStudentDashboard(session) {
  await loadStudentDashboardData(session);
  bindMessageForm(session);
}

async function loadStudentDashboardData(session) {
  try {
    const dashboard = await apiRequest(
      'getStudentDashboardData',
      { student_user_id: session.user_id },
      'GET'
    );

    if (!dashboard.success) {
      throw new Error(dashboard.message || 'Failed to load dashboard.');
    }

    const summary = dashboard.summary || {};

    renderSummaryCards('student-summary-cards', [
      { label: 'Classes', value: summary.total_classes || 0 },
      { label: 'Assignments', value: summary.total_assignments || 0 },
      { label: 'Announcements', value: summary.total_announcements || 0 },
      { label: 'Grade Entries', value: summary.total_grades || 0 }
    ]);

    renderStackList(
      'student-assignment-list',
      [],
      (a) => `<li><strong>${a.title}</strong><br>${a.description}<br>Due: ${a.due_date}</li>`,
      'Assignments are not returned by the current dashboard endpoint yet.'
    );

    renderStackList(
      'student-announcement-list',
      [],
      (a) => `<li><strong>${a.title}</strong><br>${a.content}<br>${a.date_posted}</li>`,
      'Announcements are not returned by the current dashboard endpoint yet.'
    );

    renderStackList(
      'student-calendar-list',
      [],
      (c) => `<li><strong>${c.title}</strong><br>${c.event_date} (${c.event_type})</li>`,
      'Calendar events are not returned by the current dashboard endpoint yet.'
    );

    renderStackList(
      'message-list',
      [],
      (m) => `<li>${m.sent_at}: ${m.message_body}</li>`,
      'Messages are not returned by the current dashboard endpoint yet.'
    );

    document.getElementById('student-grade-table').innerHTML =
      '<tr><td colspan="4">Grades are not returned by the current dashboard endpoint yet.</td></tr>';
  } catch (error) {
    setMessage('message-status', error.message, true);
  }
}

function bindMessageForm(session) {
  document.getElementById('message-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    payload.sender_user_id = session.user_id;

    try {
      const result = await apiRequest('sendMessage', payload);

      if (!result.success) {
        throw new Error(result.message || 'Failed to send message.');
      }

      setMessage('message-status', 'Message sent.');
      event.currentTarget.reset();
      await loadStudentDashboardData(session);
    } catch (error) {
      setMessage('message-status', error.message, true);
    }
  });
}
