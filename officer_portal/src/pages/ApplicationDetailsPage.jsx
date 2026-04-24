import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { approveApplication, fetchApplicationDetails, rejectApplication } from '../api/applicationApi';
import { verifyDocument } from '../api/documentApi';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../api/client';

export default function ApplicationDetailsPage() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const { token, signOut } = useAuth();
  const [application, setApplication] = useState(null);
  const [message, setMessage] = useState('Loading application...');
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadApplication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  async function loadApplication() {
    const response = await fetchApplicationDetails(token, applicationId);
    if (response.authError) {
      signOut();
      return;
    }
    if (response.success) {
      setApplication(response.data);
      setMessage('');
    } else {
      setMessage(response.message || 'Failed to load application.');
    }
  }

  async function handleApprove() {
    const response = await approveApplication(token, applicationId);
    setMessage(response.message || 'Application updated.');
    if (response.success) {
      loadApplication();
    }
  }

  async function handleReject() {
    const response = await rejectApplication(token, applicationId, rejectReason);
    setMessage(response.message || 'Application updated.');
    if (response.success) {
      loadApplication();
    }
  }

  async function handleVerifyDocument(documentId, status) {
    const reason = status === 'rejected'
      ? window.prompt('Enter rejection reason', 'Document is invalid or unclear.') || 'Rejected by officer.'
      : '';

    const response = await verifyDocument(token, documentId, status, reason);
    setMessage(response.message || 'Document updated.');
    if (response.success) {
      loadApplication();
    }
  }

  if (!application) {
    return <div className="card">{message}</div>;
  }

  const paidApplicationFee = application.payments?.some(
    (payment) => payment.paymentType === 'application_fee' && payment.status === 'paid'
  );

  return (
    <div style={{ display: 'grid', gap: '16px' }}>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="secondary" onClick={() => navigate('/applications')}>Back</button>
        <button onClick={loadApplication}>Refresh</button>
      </div>

      {message ? <p>{message}</p> : null}

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Vendor Details</h2>
        <p><strong>Name:</strong> {application.vendor?.fullName}</p>
        <p><strong>Phone:</strong> {application.vendor?.phone}</p>
        <p><strong>Email:</strong> {application.vendor?.email || 'N/A'}</p>
        <p><strong>National ID:</strong> {application.vendor?.nationalId}</p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Application Details</h2>
        <p><strong>Business Name:</strong> {application.businessName || 'N/A'}</p>
        <p><strong>Category:</strong> {application.businessCategory}</p>
        <p><strong>Market Type:</strong> {application.marketType}</p>
        <p><strong>Status:</strong> <span className="pill">{application.status}</span></p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Payment Status</h2>
        <p><strong>Application Fee:</strong> {paidApplicationFee ? 'Paid' : 'Not yet confirmed'}</p>
        <ul>
          {application.payments?.map((payment) => (
            <li key={payment.id}>
              {payment.paymentType} - {payment.amount} {payment.currency} - {payment.status}
            </li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Documents</h2>
        {!application.documents?.length ? <p>No documents uploaded yet.</p> : null}
        {application.documents?.map((doc) => (
          <div key={doc.id} style={{ border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
            <p><strong>{doc.documentType}</strong></p>
            <p>
              <a href={`${API_BASE.replace('/api', '')}${doc.fileUrl}`} target="_blank" rel="noreferrer">
                {doc.fileName}
              </a>
            </p>
            <p>Status: <span className="pill">{doc.verificationStatus}</span></p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleVerifyDocument(doc.id, 'approved')}>Approve Document</button>
              <button className="danger" onClick={() => handleVerifyDocument(doc.id, 'rejected')}>Reject Document</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Decision</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleApprove} disabled={!paidApplicationFee}>Approve Application</button>
        </div>
        <div style={{ marginTop: '16px' }}>
          <textarea
            rows="4"
            placeholder="Reason for rejection"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <button className="danger" onClick={handleReject} style={{ marginTop: '10px' }}>
            Reject Application
          </button>
        </div>
      </div>
    </div>
  );
}
