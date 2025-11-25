const apiBase = '/api/auth';

// Handle login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const res = await fetch(`${apiBase}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // ✅ Redirect based on admin flag
      if (data.user.is_admin) {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } else {
      alert(data.error || data.message || '❌ Login failed');
    }
  });
}

// Handle register
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const full_name = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    const res = await fetch(`${apiBase}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name, email, password })
    });

    const data = await res.json();

    if (res.ok) {
      alert(data.message || '✅ Registration successful! Please wait for admin approval.');
      window.location.href = '/login';
    } else {
      alert(data.error || data.message || '❌ Registration failed.');
    }
  });
}

// Handle logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = '/login';
  });
}
