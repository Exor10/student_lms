function getSessionOrRedirect(requiredRole) {
  const sessionRaw = sessionStorage.getItem('edulms_session');
  if (!sessionRaw) {
    window.location.href = '../index.html';
    return null;
  }

  const session = JSON.parse(sessionRaw);
  if (session.role !== requiredRole) {
    window.location.href = '../index.html';
    return null;
  }
  return session;
}

function bindDashboardShell() {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((x) => x.classList.remove('active'));
      document.querySelectorAll('.panel-section').forEach((x) => x.classList.remove('active'));
      item.classList.add('active');
      document.getElementById(item.dataset.section)?.classList.add('active');
    });
  });

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    sessionStorage.removeItem('edulms_session');
    window.location.href = '../index.html';
  });

  document.getElementById('toggle-theme')?.addEventListener('click', () => {
    document.body.classList.toggle('dark');
  });
}

function renderSummaryCards(containerId, cards) {
  const container = document.getElementById(containerId);
  container.innerHTML = cards
    .map((item) => `<article class="card"><h4>${item.label}</h4><p>${item.value}</p></article>`)
    .join('');
}

function renderStackList(containerId, items, formatter) {
  const container = document.getElementById(containerId);
  if (!items.length) {
    container.innerHTML = '<li>No records available yet.</li>';
    return;
  }
  container.innerHTML = items.map(formatter).join('');
}
