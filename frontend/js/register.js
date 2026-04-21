const roleSelect = document.getElementById('role');
const studentFields = document.getElementById('student-fields');
const teacherFields = document.getElementById('teacher-fields');

roleSelect?.addEventListener('change', () => {
  const role = roleSelect.value;
  studentFields.classList.toggle('hidden', role !== 'student');
  teacherFields.classList.toggle('hidden', role !== 'teacher');
});

document.getElementById('register-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  const action = payload.role === 'teacher' ? 'registerTeacher' : 'registerStudent';

  try {
    await apiRequest(action, payload);
    setMessage('register-message', 'Registration successful. You may now log in.');
    event.currentTarget.reset();
    studentFields.classList.remove('hidden');
    teacherFields.classList.add('hidden');
  } catch (error) {
    setMessage('register-message', error.message, true);
  }
});
