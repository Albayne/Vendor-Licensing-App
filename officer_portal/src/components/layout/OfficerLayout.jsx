import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/applications', label: 'Applications' },
  { to: '/allocation', label: 'Allocation' },
  { to: '/permit-verify', label: 'Permit Verification' },
  { to: '/audit-logs', label: 'Audit Logs' },
];

export default function OfficerLayout() {
  const { officer, signOut } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    signOut();
    navigate('/login');
  }

  return (
    <div className="page-shell">
      <aside className="sidebar">
        <h2>Officer Portal</h2>
        <div style={{ opacity: 0.9, fontSize: '0.95rem' }}>
          {officer?.fullName || 'Officer'}
          <br />
          <span style={{ textTransform: 'capitalize' }}>{officer?.role || 'role'}</span>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <button style={{ marginTop: '20px', width: '100%' }} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main className="main-area">
        <div className="topbar">
          <div>
            <h1 style={{ margin: 0 }}>Smart Vendor Management</h1>
            <p style={{ margin: '6px 0 0' }}>Municipal licensing, allocation, and permit oversight.</p>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
