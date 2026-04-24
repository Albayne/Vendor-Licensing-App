import { useEffect, useState } from 'react';
import { fetchAuditLogs } from '../api/auditApi';
import { useAuth } from '../context/AuthContext';

export default function AuditLogsPage() {
  const { token, signOut } = useAuth();
  const [logs, setLogs] = useState([]);
  const [message, setMessage] = useState('Loading audit logs...');

  useEffect(() => {
    loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadLogs() {
    const response = await fetchAuditLogs(token);
    if (response.authError) {
      signOut();
      return;
    }
    if (response.success) {
      setLogs(response.data);
      setMessage(response.data.length ? '' : 'No audit logs available yet.');
    } else {
      setMessage(response.message || 'Failed to load audit logs.');
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Audit Logs</h2>
      {message ? <p>{message}</p> : null}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity Type</th>
              <th>Entity ID</th>
              <th>Actor</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.action}</td>
                <td>{log.entityType}</td>
                <td>{log.entityId}</td>
                <td>{log.actorUserId || 'System'}</td>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
