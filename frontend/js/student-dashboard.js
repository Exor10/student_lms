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
    const dashboard = await apiRequest('getStudentDashboardData', { user_id: session.user_id }, 'GET');
    const { assignments, announcements, grades, calendar_events, messages } = dashboard.data;

    renderSummaryCards('student-summary-cards', [
      { label: 'Open Assignments', value: assignments.length },
      { label: 'Announcements', value: announcements.length },
      { label: 'Grade Entries', value: grades.length },
      { label: 'Calendar Events', value: calendar_events.length }
    ]);

    renderStackList('student-assignment-list', assignments, (a) => `<li><strong>${a.title}</strong><br>${a.description}<br>Due: ${a.due_date}</li>`);
    renderStackList('student-announcement-list', announcements, (a) => `<li><strong>${a.title}</strong><br>${a.content}<br>${a.date_posted}</li>`);
    renderStackList('student-calendar-list', calendar_events, (c) => `<li><strong>${c.title}</strong><br>${c.event_date} (${c.event_type})</li>`);
    renderStackList('message-list', messages || [], (m) => `<li>${m.sent_at}: ${m.message_body}</li>`);

    document.getElementById('student-grade-table').innerHTML = grades.length
      ? grades.map((g) => `<tr><td>${g.assignment_id}</td><td>${g.score}</td><td>${g.remarks}</td><td>${g.date_recorded}</td></tr>`).join('')
      : '<tr><td colspan="4">No grades yet.</td></tr>';
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
      await apiRequest('sendMessage', payload);
      setMessage('message-status', 'Message sent.');
      event.currentTarget.reset();
      await loadStudentDashboardData(session);
    } catch (error) {
      setMessage('message-status', error.message, true);
    }
  });
}
