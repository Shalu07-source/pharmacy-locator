import { useState } from 'react';

function SigninPage({ onSubmit, onNavigate, loading }) {
  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <p className="section-label">Welcome Back</p>
        <h2>Sign in to continue</h2>
        <p className="section-text">Use your account to access the pharmacy locator dashboard and profile.</p>

        <label className="field-group" htmlFor="signin-email">
          <span>Email</span>
          <input id="signin-email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>

        <label className="field-group" htmlFor="signin-password">
          <span>Password</span>
          <input id="signin-password" name="password" type="password" value={form.password} onChange={handleChange} required />
        </label>

        <button type="submit" className="primary-button auth-submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>

        <p className="auth-footer">
          New here?{' '}
          <button type="button" className="link-button" onClick={() => onNavigate('/signup')}>
            Create an account
          </button>
        </p>
      </form>
    </section>
  );
}

export default SigninPage;
