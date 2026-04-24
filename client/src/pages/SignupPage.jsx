import { useState } from 'react';

function SignupPage({ onSubmit, onNavigate, loading }) {
  const [form, setForm] = useState({
    name: '',
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
        <p className="section-label">Create Account</p>
        <h2>Sign up for Pharmacy Locator</h2>
        <p className="section-text">Create your account to search pharmacies and save your session securely.</p>

        <label className="field-group" htmlFor="signup-name">
          <span>Name</span>
          <input id="signup-name" name="name" type="text" value={form.name} onChange={handleChange} required />
        </label>

        <label className="field-group" htmlFor="signup-email">
          <span>Email</span>
          <input id="signup-email" name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>

        <label className="field-group" htmlFor="signup-password">
          <span>Password</span>
          <input
            id="signup-password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
        </label>

        <button type="submit" className="primary-button auth-submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Signup'}
        </button>

        <p className="auth-footer">
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={() => onNavigate('/login')}>
            Sign in
          </button>
        </p>
      </form>
    </section>
  );
}

export default SignupPage;
