import { useEffect, useState } from 'react';
import { allocateStall, fetchApplicationsAwaitingAllocation, fetchVacantStalls } from '../api/stallApi';
import { useAuth } from '../context/AuthContext';

export default function AllocationPage() {
  const { token, signOut } = useAuth();
  const [applications, setApplications] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedStallId, setSelectedStallId] = useState('');
  const [message, setMessage] = useState('Loading allocation queue...');

  useEffect(() => {
    loadApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadApplications() {
    const response = await fetchApplicationsAwaitingAllocation(token);
    if (response.authError) {
      signOut();
      return;
    }
    if (response.success) {
      setApplications(response.data);
      setMessage(response.data.length ? '' : 'No applications are waiting for allocation.');
    } else {
      setMessage(response.message || 'Failed to load queue.');
    }
  }

  async function handleSelectApplication(application) {
    setSelectedApplication(application);
    setSelectedStallId('');
    const response = await fetchVacantStalls(token, application.requestedMarketId || '');
    if (response.success) {
      setStalls(response.data);
    } else {
      setStalls([]);
      setMessage(response.message || 'Failed to load vacant stalls.');
    }
  }

  async function handleAllocate() {
    if (!selectedApplication || !selectedStallId) {
      setMessage('Please select an application and a stall.');
      return;
    }

    const response = await allocateStall(token, selectedApplication.id, selectedStallId);
    setMessage(response.message || 'Allocation updated.');

    if (response.success) {
      setSelectedApplication(null);
      setSelectedStallId('');
      setStalls([]);
      loadApplications();
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Applications Awaiting Allocation</h2>
        {message && !selectedApplication ? <p>{message}</p> : null}
        {applications.map((app) => (
          <div key={app.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px', marginBottom: '12px' }}>
            <p><strong>{app.vendor?.fullName}</strong></p>
            <p>{app.businessCategory}</p>
            <p>{app.marketType}</p>
            <button onClick={() => handleSelectApplication(app)}>Select</button>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Vacant Stalls</h2>
        {!selectedApplication ? (
          <p>Select an application to load matching stalls.</p>
        ) : (
          <>
            <p>Assigning stall to <strong>{selectedApplication.vendor?.fullName}</strong></p>
            <select value={selectedStallId} onChange={(e) => setSelectedStallId(e.target.value)}>
              <option value="">Choose a stall</option>
              {stalls.map((stall) => (
                <option key={stall.id} value={stall.id}>
                  {stall.stallCode} - {stall.stallType} - USD {stall.monthlyFee}
                </option>
              ))}
            </select>
            <button onClick={handleAllocate} style={{ marginTop: '14px' }}>Allocate Stall</button>
          </>
        )}
        {selectedApplication && message ? <p style={{ marginTop: '12px' }}>{message}</p> : null}
      </div>
    </div>
  );
}
