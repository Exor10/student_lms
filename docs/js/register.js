document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const roleSelect = document.getElementById('role');
  const studentFields = document.getElementById('studentFields');
  const teacherFields = document.getElementById('teacherFields');
  const message = document.getElementById('message');

  function updateRoleFields() {
    const role = roleSelect.value;
    studentFields.classList.toggle('hidden', role !== 'student');
    teacherFields.classList.toggle('hidden', role !== 'teacher');
  }

  roleSelect.addEventListener('change', updateRoleFields);
  updateRoleFields();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    message.className = 'message hidden';

    const baseData = {
      full_name: form.full_name.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value
    };

    const role = roleSelect.value;

    try {
      const result = role === 'teacher'
        ? await EduApi.registerTeacher({ ...baseData, department: form.department.value.trim() })
        : await EduApi.registerStudent({
            ...baseData,
            student_number: form.student_number.value.trim(),
            section: form.section.value.trim(),
            year_level: form.year_level.value.trim()
          });

      if (!result.success) throw new Error(result.message || 'Registration failed');

      message.textContent = 'Registration successful. Please log in.';
      message.className = 'message success';
      form.reset();
      updateRoleFields();
    } catch (err) {
      message.textContent = err.message;
      message.className = 'message error';
    }
  });
});
