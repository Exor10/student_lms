document.addEventListener('DOMContentLoaded', async () => {
  const auth = EduAuth.requireRole('student');
  if (!auth) return;

  EduAuth.bindThemeToggle('themeToggle');
  document.getElementById('logoutBtn').addEventListener('click', () => {
    EduAuth.clearSession();
    window.location.href = 'index.html';
  });

  document.getElementById('studentName').textContent = auth.full_name;

  const ui = {
    summaryAssignments: document.getElementById('summaryAssignments'),
    summaryAnnouncements: document.getElementById('summaryAnnouncements'),
    summaryGrades: document.getElementById('summaryGrades'),
    assignmentsBody: document.getElementById('assignmentsBody'),
    announcementsList: document.getElementById('announcementsList'),
    gradesBody: document.getElementById('gradesBody'),
    calendarList: document.getElementById('calendarList'),
    messageHistory: document.getElementById('messageHistory')
  };

  async function loadStudent() {
    const data = await EduApi.getStudentDashboardData({ student_user_id: auth.user_id });
    if (!data.success) throw new Error(data.message || 'Unable to load dashboard data.');

    const summary = data.summary || {};
    const assignments = data.assignments || [];
    const announcements = data.announcements || [];
    const grades = data.grades || [];
    const calendar = data.calendar || [];
    const messages = data.messages || [];

    ui.summaryAssignments.textContent = summary.total_assignments ?? summary.assignments ?? assignments.length;
    ui.summaryAnnouncements.textContent = summary.total_announcements ?? summary.announcements ?? announcements.length;
    ui.summaryGrades.textContent = summary.total_grades ?? summary.grades ?? grades.length;

    ui.assignmentsBody.innerHTML = assignments.length ? assignments.map(a =>
      `<tr><td>${a.title}</td><td>${a.description}</td><td>${a.due_date}</td><td>${a.status}</td></tr>`).join('')
      : `<tr><td colspan="4"><div class="empty-state">No upcoming assignments.</div></td></tr>`;

    ui.announcementsList.innerHTML = announcements.length ? announcements.map(a =>
      `<div class="card" style="margin-bottom:10px"><div class="card-head">${a.title}</div><div class="card-body">${a.content}<br><small>${a.date_posted}</small></div></div>`).join('')
      : `<div class="empty-state">No announcements yet.</div>`;

    ui.gradesBody.innerHTML = grades.length ? grades.map(g =>
      `<tr><td>${g.assignment_title}</td><td>${g.score}</td><td>${g.remarks}</td><td>${g.date_recorded}</td></tr>`).join('')
      : `<tr><td colspan="4"><div class="empty-state">No grades available yet.</div></td></tr>`;

    ui.calendarList.innerHTML = calendar.length ? calendar.map(c => `<li>${c.event_date} - ${c.title} (${c.event_type})</li>`).join('')
      : `<div class="empty-state">No class events on calendar.</div>`;

    ui.messageHistory.innerHTML = messages.length ? messages.map(m => `<li><strong>${m.sender_name}:</strong> ${m.message_body} <small>${m.sent_at}</small></li>`).join('')
      : `<div class="empty-state">No messages with teacher.</div>`;
  }

  const messageForm = document.getElementById('messageForm');
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = messageForm.querySelector('.message');
    msg.className = 'message hidden';
    try {
      const payload = Object.fromEntries(new FormData(messageForm));
      const sendRes = await EduApi.sendMessage({ ...payload, sender_user_id: auth.user_id });
      if (!sendRes.success) throw new Error(sendRes.message);
      msg.textContent = 'Message sent.';
      msg.className = 'message success';
      messageForm.reset();
      await loadStudent();
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'message error';
    }
  });

  try {
    await loadStudent();
  } catch (err) {
    alert(err.message);
  }
});
