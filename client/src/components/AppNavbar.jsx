function AppNavbar({ user, onNavigate, onLogout }) {
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <header className="navbar">
      <button type="button" className="brand-block brand-button" onClick={() => onNavigate('/')}>
        <div className="brand-mark">+</div>
        <div>
          <h1>Pharmacy Locator</h1>
          <p>Nearby hospitals, pharmacies, and medical shops</p>
        </div>
      </button>

      <div className="nav-spacer" />

      <div className="nav-actions">
        {!user ? (
          <>
            <button type="button" className="ghost-button" onClick={() => onNavigate('/login')}>
              Login
            </button>
            <button type="button" className="primary-button" onClick={() => onNavigate('/signup')}>
              Signup
            </button>
          </>
        ) : (
          <>
            <button type="button" className="profile-chip" onClick={() => onNavigate('/profile')}>
              <span className="profile-avatar">{userInitial}</span>
              <span>{user.name}</span>
            </button>
            <button type="button" className="ghost-button" onClick={onLogout}>
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default AppNavbar;
