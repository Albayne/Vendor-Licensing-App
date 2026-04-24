import { useEffect, useState } from 'react';
import { fetchDashboardSummary } from '../api/officerApi';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { token, signOut } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSummary() {
    const response = await fetchDashboardSummary(token);
    if (response.authError) {
      signOut();
      return;
    }
    if (response.success) {
      setSummary(response.data);
      setError('');
    } else {
      setError(response.message || 'Failed to load dashboard.');
    }
  }

  const cards = summary
    ? [
        ['Pending Applications', summary.pendingApplications],
        ['Awaiting Allocation', summary.awaitingAllocation],
        ['Vacant Stalls', summary.vacantStalls],
        ['Occupied Stalls', summary.occupiedStalls],
        ['Unread Vendor Notifications', summary.unreadVendorNotifications],
        ['Permits Expiring Soon', summary.expiringPermits],
      ]
    : [];

  return (
    <div>
      {error ? <p className="error">{error}</p> : null}
      {!summary ? (
        <div className="card">Loading dashboard...</div>
      ) : (
        <div className="card-grid">
          {cards.map(([title, value]) => (
            <div className="card" key={title}>
              <h3 style={{ marginTop: 0 }}>{title}</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
