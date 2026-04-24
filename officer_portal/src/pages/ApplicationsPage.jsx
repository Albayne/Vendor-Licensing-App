import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPendingApplications } from '../api/applicationApi';
import { useAuth } from '../context/AuthContext';

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const { token, signOut } = useAuth();
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState('Loading applications...');

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadApplications() {
    const response = await fetchPendingApplications(token);
    if (response.authError) {
      signOut();
      return;
    }
    if (response.success) {
      setApplications(response.data);
      setMessage(response.data.length ? '' : 'No applications require review right now.');
    } else {
      setMessage(response.message || 'Failed to load applications.');
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Pending Applications</h2>
      {message ? <p>{message}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Category</th>
              <th>Market Type</th>
              <th>Status</th>
              <th>Submitted</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id}>
                <td>{app.vendor?.fullName}</td>
                <td>{app.businessCategory}</td>
                <td>{app.marketType}</td>
                <td><span className="pill">{app.status}</span></td>
                <td>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : '—'}</td>
                <td>
                  <button onClick={() => navigate(`/applications/${app.id}`)}>Review</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
