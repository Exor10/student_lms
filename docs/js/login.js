document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const message = document.getElementById('message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.className = 'message hidden';

    const email = form.email.value.trim();
    const password = form.password.value;

    try {
      const result = await EduApi.loginUser({ email, password });
      if (!result.success) throw new Error(result.message || 'Login failed');

      EduAuth.setSession(result.data);
      window.location.href = result.data.role === 'teacher' ? 'teacher-dashboard.html' : 'student-dashboard.html';
    } catch (err) {
      message.textContent = err.message;
      message.className = 'message error';
    }
  });
});
