document.getElementById('token').value = new URLSearchParams(window.location.search).get('token');

    document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = e.target.token.value;
      const password = e.target.password.value;

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();
      const alert = document.getElementById('resetAlert');

      if (data.success) {
        alert.innerHTML = `<div class="alert alert-success">${data.message}. Redirecting to login...</div>`;
        setTimeout(() => window.location.href = 'login.html', 2500);
      } else {
        alert.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
      }
    });