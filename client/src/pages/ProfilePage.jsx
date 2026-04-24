function ProfilePage({ user, onLogout }) {
  return (
    <section className="auth-page">
      <div className="auth-card profile-card">
        <p className="section-label">Profile</p>
        <h2>Your account</h2>
        <p className="section-text">You are signed in and can access the pharmacy locator dashboard.</p>

        <div className="profile-details">
          <div className="profile-row">
            <span>Name</span>
            <strong>{user?.name}</strong>
          </div>
          <div className="profile-row">
            <span>Email</span>
            <strong>{user?.email}</strong>
          </div>
        </div>

        <button type="button" className="primary-button auth-submit" onClick={onLogout}>
          Logout
        </button>
      </div>
    </section>
  );
}

export default ProfilePage;
