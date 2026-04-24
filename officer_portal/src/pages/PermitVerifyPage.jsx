import { useState } from 'react';
import { verifyPermit } from '../api/permitApi';
import { useAuth } from '../context/AuthContext';

export default function PermitVerifyPage() {
  const { token, signOut } = useAuth();
  const [qrPayload, setQrPayload] = useState('');
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');

  async function handleVerify() {
    const response = await verifyPermit(token, qrPayload);
    if (response.authError) {
      signOut();
      return;
    }
    setMessage(response.message || '');
    if (response.success) {
      setResult(response.data);
    } else {
      setResult(null);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Permit Verification</h2>
      <textarea
        rows="6"
        value={qrPayload}
        onChange={(e) => setQrPayload(e.target.value)}
        placeholder="Paste scanned QR payload here"
      />
      <button onClick={handleVerify} style={{ marginTop: '12px' }}>Verify Permit</button>
      {message ? <p>{message}</p> : null}
      {result ? (
        <div style={{ marginTop: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '14px' }}>
          <p><strong>Valid:</strong> {result.valid ? 'Yes' : 'No'}</p>
          <p><strong>Permit Number:</strong> {result.permit.permitNumber}</p>
          <p><strong>Vendor:</strong> {result.permit.vendorName}</p>
          <p><strong>Phone:</strong> {result.permit.vendorPhone}</p>
          <p><strong>Market:</strong> {result.permit.marketName}</p>
          <p><strong>Stall:</strong> {result.permit.stallCode}</p>
          <p><strong>Expires:</strong> {new Date(result.permit.expiresAt).toLocaleString()}</p>
        </div>
      ) : null}
    </div>
  );
}
