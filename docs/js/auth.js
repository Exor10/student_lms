(function () {
  function setSession(auth) {
    sessionStorage.setItem('edulms_auth', JSON.stringify(auth));
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem('edulms_auth') || 'null');
    } catch {
      return null;
    }
  }

  function clearSession() {
    sessionStorage.removeItem('edulms_auth');
  }

  function requireRole(role) {
    const auth = getSession();
    if (!auth || auth.role !== role) {
      clearSession();
      window.location.href = 'index.html';
      return null;
    }
    return auth;
  }

  function bindThemeToggle(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    const toggle = () => {
      document.body.classList.toggle('dark');
      btn.textContent = document.body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
    };

    btn.addEventListener('click', toggle);
  }

  window.EduAuth = {
    setSession,
    getSession,
    clearSession,
    requireRole,
    bindThemeToggle
  };
})();
