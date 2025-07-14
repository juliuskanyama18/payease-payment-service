document.getElementById('forgotPasswordForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = e.target.email.value;

  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    const alert = document.getElementById('resetAlert');

    if (data.success) {
      alert.innerHTML = `<div class="alert alert-success">${data.message}</div>`;
    } else {
      alert.innerHTML = `<div class="alert alert-error">${data.message}</div>`;
    }
  } catch (err) {
    document.getElementById('resetAlert').innerHTML = `<div class="alert alert-error">Something went wrong.</div>`;
  }
});
