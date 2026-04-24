import { useEffect, useState } from 'react';
import AppNavbar from './components/AppNavbar';
import LocatorDashboard from './components/LocatorDashboard';
import Toast from './components/Toast';
import ProfilePage from './pages/ProfilePage';
import SigninPage from './pages/SigninPage';
import SignupPage from './pages/SignupPage';
import VerificationSuccessPage from './pages/VerificationSuccessPage';
import { fetchProfile, signinUser, signupUser } from './services/auth';

const PUBLIC_ROUTES = new Set(['/login', '/signup', '/verified']);
const PROTECTED_ROUTES = new Set(['/profile']);

function getCurrentRoute() {
  const hash = window.location.hash.replace('#', '').trim();
  return hash || '/';
}

function App() {
  const [route, setRoute] = useState(getCurrentRoute());
  const [toast, setToast] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const navigate = (nextRoute) => {
    window.location.hash = nextRoute;
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const handleLogout = () => {
    clearSession();
    showToast('Logged out successfully');
    navigate('/login');
  };

  useEffect(() => {
    const onHashChange = () => {
      setRoute(getCurrentRoute());
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setToast(null);
    }, 2500);

    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const data = await fetchProfile(token);

        if (cancelled) {
          return;
        }

        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      } catch (_error) {
        if (!cancelled) {
          clearSession();
          showToast('Session expired. Please sign in again.', 'error');
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!token && PROTECTED_ROUTES.has(route)) {
      navigate('/login');
      return;
    }

    if (token && PUBLIC_ROUTES.has(route)) {
      navigate('/');
    }
  }, [authLoading, route, token]);

  const handleSignup = async (formValues) => {
    setFormLoading(true);

    try {
      const data = await signupUser(formValues);
      showToast('Verification email sent. Check your inbox.');
      navigate('/login');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to register right now', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignin = async (formValues) => {
    setFormLoading(true);

    try {
      const data = await signinUser(formValues);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      showToast(data.message || 'Successfully Signed In');
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.message || 'Unable to sign in right now', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  let pageContent = null;

  if (route === '/profile' && authLoading) {
    pageContent = (
      <section className="auth-page">
        <div className="auth-card">
          <p className="section-label">Loading</p>
          <h2>Preparing your session</h2>
          <p className="section-text">Please wait while we restore your account.</p>
        </div>
      </section>
    );
  } else if (route === '/signup') {
    pageContent = <SignupPage onSubmit={handleSignup} onNavigate={navigate} loading={formLoading} />;
  } else if (route === '/verified') {
    pageContent = <VerificationSuccessPage onNavigate={navigate} />;
  } else if (route === '/login') {
    pageContent = <SigninPage onSubmit={handleSignin} onNavigate={navigate} loading={formLoading} />;
  } else if (route === '/profile') {
    pageContent = token ? <ProfilePage user={user} onLogout={handleLogout} /> : null;
  } else {
    pageContent = <LocatorDashboard />;
  }

  return (
    <div className="app-shell">
      <AppNavbar user={user} onNavigate={navigate} onLogout={handleLogout} />
      <Toast toast={toast} />
      {pageContent}
    </div>
  );
  {user ? (
  <Chatbot token={user.token} />
) : (
  <div className="chat-lock">
    🔒 Login to access AI Medicine Assistant
  </div>
)}
}

export default App;
