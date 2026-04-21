document.addEventListener('DOMContentLoaded', async () => {
  const auth = EduAuth.requireRole('teacher');
  if (!auth) return;

  EduAuth.bindThemeToggle('themeToggle');
  document.getElementById('logoutBtn').addEventListener('click', () => {
    EduAuth.clearSession();
    window.location.href = 'index.html';
  });

  document.getElementById('teacherName').textContent = auth.full_name;

  const ui = {
    summaryStudents: document.getElementById('summaryStudents'),
    summaryAssignments: document.getElementById('summaryAssignments'),
    summaryAnnouncements: document.getElementById('summaryAnnouncements'),
    summaryGrades: document.getElementById('summaryGrades'),
    studentsBody: document.getElementById('studentsBody'),
    assignmentsBody: document.getElementById('assignmentsBody'),
    announcementsList: document.getElementById('announcementsList'),
    gradesBody: document.getElementById('gradesBody'),
    calendarList: document.getElementById('calendarList')
  };
  let defaultClassId = '';

  async function loadDashboard() {
    const dashboard = await EduApi.getTeacherDashboardData({ teacher_user_id: auth.user_id });
    if (!dashboard.success) throw new Error(dashboard.message || 'Unable to load dashboard data.');

    const summary = dashboard.summary || {};
    const classes = dashboard.classes || [];
    defaultClassId = classes[0]?.class_id || '';

    const [studentsRes, assignmentsRes, announcementsRes, calendarRes] = defaultClassId
      ? await Promise.all([
        EduApi.getClassStudents({ teacher_user_id: auth.user_id, class_id: defaultClassId }),
        EduApi.getAssignments({ class_id: defaultClassId }),
        EduApi.getAnnouncements({ class_id: defaultClassId }),
        EduApi.getCalendarEvents({ class_id: defaultClassId })
      ])
      : [{ success: true }, { success: true }, { success: true }, { success: true }];

    const students = studentsRes.students || studentsRes.data || [];
    const assignments = assignmentsRes.assignments || assignmentsRes.data || [];
    const announcements = announcementsRes.announcements || announcementsRes.data || [];
    const calendar = calendarRes.calendar || calendarRes.data || [];
    const grades = dashboard.grades || [];

    ui.summaryStudents.textContent = summary.total_classes ?? summary.total_students ?? classes.length;
    ui.summaryAssignments.textContent = summary.total_assignments ?? summary.assignments ?? assignments.length;
    ui.summaryAnnouncements.textContent = summary.total_announcements ?? summary.announcements ?? announcements.length;
    ui.summaryGrades.textContent = summary.total_grades ?? summary.grades ?? grades.length;

    ui.studentsBody.innerHTML = students.length ? students.map(s => `
      <tr><td>${s.student_number}</td><td>${s.full_name}</td><td>${s.section}</td><td>${s.year_level}</td></tr>`).join('')
      : `<tr><td colspan="4"><div class="empty-state">No students added yet.</div></td></tr>`;

    ui.assignmentsBody.innerHTML = assignments.length ? assignments.map(a => `
      <tr><td>${a.title}</td><td>${a.description}</td><td>${a.due_date}</td><td><span class="badge">${a.status}</span></td></tr>`).join('')
      : `<tr><td colspan="4"><div class="empty-state">No assignments yet.</div></td></tr>`;

    ui.announcementsList.innerHTML = announcements.length ? announcements.map(a => `
      <div class="card" style="margin-bottom:10px"><div class="card-head">${a.title}</div><div class="card-body">${a.content}<br><small>${a.date_posted}</small></div></div>`).join('')
      : `<div class="empty-state">No announcements posted.</div>`;

    ui.gradesBody.innerHTML = grades.length ? grades.map(g => `
      <tr><td>${g.student_name}</td><td>${g.assignment_title}</td><td>${g.score}</td><td>${g.remarks}</td></tr>`).join('')
      : `<tr><td colspan="4"><div class="empty-state">No grades assigned.</div></td></tr>`;

    if (calendar.length) {
      ui.calendarList.innerHTML = calendar.map(c => `<li>${c.event_date} - ${c.title} (${c.event_type})</li>`).join('');
    } else if (classes.length) {
      ui.calendarList.innerHTML = `
        <div class="empty-state">No calendar events yet. Your classes: ${classes.map(c => c.class_name || c.class_id).join(', ')}</div>
      `;
    } else {
      ui.calendarList.innerHTML = `<div class="empty-state">No classes or calendar events available yet.</div>`;
    }
  }

  async function submitForm(formId, requestFn, transformData = (f) => Object.fromEntries(new FormData(f))) {
    const form = document.getElementById(formId);
    const msg = form.querySelector('.message');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.className = 'message hidden';
      try {
        const payload = transformData(form);
        const requestPayload = { ...payload, teacher_user_id: auth.user_id };
        const classIdFromForm = payload.class_id || '';
        const resolvedClassId = classIdFromForm || defaultClassId;

        if (formId === 'assignmentForm' || formId === 'announcementForm') {
          if (!resolvedClassId) {
            throw new Error('No class available. Please create or assign a class before submitting.');
          }
          requestPayload.class_id = resolvedClassId;
        }

        if (formId === 'gradeForm') {
          const missingFields = [];
          if (!resolvedClassId) missingFields.push('class_id');
          if (!payload.student_id) missingFields.push('student_id');
          if (!payload.assignment_id) missingFields.push('assignment_id');
          if (missingFields.length) {
            throw new Error(`Cannot submit grade. Missing required field(s): ${missingFields.join(', ')}.`);
          }
          requestPayload.class_id = resolvedClassId;
        }

        const res = await requestFn(requestPayload);
        if (!res.success) throw new Error(res.message);
        msg.textContent = 'Saved successfully.';
        msg.className = 'message success';
        form.reset();
        await loadDashboard();
      } catch (err) {
        msg.textContent = err.message;
        msg.className = 'message error';
      }
    });
  }

  await submitForm('addStudentForm', EduApi.addStudent);
  await submitForm('assignmentForm', EduApi.createAssignment);
  await submitForm('announcementForm', EduApi.createAnnouncement);
  await submitForm('gradeForm', EduApi.assignGrade);

  try {
    await loadDashboard();
  } catch (e) {
    alert(e.message);
  }
});
