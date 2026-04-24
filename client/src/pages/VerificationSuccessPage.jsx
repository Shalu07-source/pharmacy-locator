function VerificationSuccessPage({ onNavigate }) {
  return (
    <section className="auth-page">
      <div className="auth-card">
        <p className="section-label">Email Verified</p>
        <h2>Email verified successfully</h2>
        <p className="section-text">Your account is now active. You can sign in and continue to the pharmacy locator.</p>
        <button type="button" className="primary-button auth-submit" onClick={() => onNavigate('/login')}>
          Go to Login
        </button>
      </div>
    </section>
  );
}

export default VerificationSuccessPage;
