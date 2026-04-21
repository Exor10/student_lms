document.getElementById('login-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  try {
    const result = await apiRequest('loginUser', payload);
    sessionStorage.setItem('edulms_session', JSON.stringify(result.data));

    if (result.data.role === 'teacher') {
      window.location.href = './pages/teacher-dashboard.html';
      return;
    }

    window.location.href = './pages/student-dashboard.html';
  } catch (error) {
    setMessage('login-message', error.message, true);
  }
});
