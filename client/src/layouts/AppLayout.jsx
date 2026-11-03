import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../app/providers.jsx';
import { useTheme } from '../hooks.js';
import { Avatar, Icon } from '../components/ui/index.jsx';

const LINKS = {
  patient: [['/documents', 'Documents'], ['/emergency', 'Emergency Profile'], ['/history', 'Activity History'], ['/profile', 'Profile']],
  doctor: [['/doctor', 'Patient Access']],
  admin: [['/admin', 'Dashboard'], ['/admin/doctors', 'Doctors']],
};

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, toggleTheme] = useTheme();
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setProgress(max > 0 ? (scrollY / max) * 100 : 0);
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  const logout = () => { signOut(); navigate('/'); };
  return (
    <div className="shell">
      <a className="skip" href="#main">Skip to content</a>
      <div className="progress" style={{ width: `${progress}%` }} />
      <header className="navbar">
        <Link to="/" className="brand"><Icon name="heart" size={22} /> Disha</Link>
        <nav className={`nav ${open ? 'nav-open' : ''}`} onClick={() => setOpen(false)} aria-label="Main">
          {(LINKS[user?.role] || []).map(([to, label]) => <NavLink key={to} to={to} end={to === '/admin'}>{label}</NavLink>)}
          {user ? <button className="link" onClick={logout}>Log out</button> : <><NavLink to="/login">Log in</NavLink><NavLink to="/register">Register</NavLink></>}
        </nav>
        {user && <Avatar userId={user.id} name={user.name} hasPhoto={user.hasPhoto} size={34} />}
        <button className="btn btn-ghost" onClick={toggleTheme} aria-label="Toggle dark mode">{theme === 'dark' ? 'Light' : 'Dark'}</button>
        <button className="hamburger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /><span /></button>
      </header>
      <main id="main" className="container"><Outlet /></main>
      <footer className="footer">Disha · Your health records, with your consent. · <Link to="/policies">Policies</Link></footer>
      <Link className="fab" to="/policies" aria-label="Company policies" title="Company policies"><Icon name="shield" /></Link>
    </div>
  );
}
