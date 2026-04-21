(function () {
  async function apiRequest(action, payload = {}, method = 'POST') {
    const base = window.EDULMS_CONFIG.API_BASE_URL;
    if (!base || base.includes('PASTE_YOUR')) {
      throw new Error('Set API_BASE_URL in docs/js/config.js');
    }

    if (method === 'GET') {
      const url = `${base}?action=${encodeURIComponent(action)}&${new URLSearchParams(payload).toString()}`;
      const res = await fetch(url);
      return res.json();
    }

    const res = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload })
    });
    return res.json();
  }

  window.EduApi = {
    registerTeacher: (data) => apiRequest('registerTeacher', data),
    registerStudent: (data) => apiRequest('registerStudent', data),
    loginUser: (data) => apiRequest('loginUser', data),
    addStudent: (data) => apiRequest('addStudent', data),
    createAnnouncement: (data) => apiRequest('createAnnouncement', data),
    createAssignment: (data) => apiRequest('createAssignment', data),
    assignGrade: (data) => apiRequest('assignGrade', data),
    getTeacherDashboardData: (params) => apiRequest('getTeacherDashboardData', params, 'GET'),
    getStudentDashboardData: (params) => apiRequest('getStudentDashboardData', params, 'GET'),
    getAssignments: (params) => apiRequest('getAssignments', params, 'GET'),
    getAnnouncements: (params) => apiRequest('getAnnouncements', params, 'GET'),
    getGrades: (params) => apiRequest('getGrades', params, 'GET'),
    getCalendarEvents: (params) => apiRequest('getCalendarEvents', params, 'GET'),
    getMessages: (params) => apiRequest('getMessages', params, 'GET'),
    sendMessage: (data) => apiRequest('sendMessage', data)
  };
})();
