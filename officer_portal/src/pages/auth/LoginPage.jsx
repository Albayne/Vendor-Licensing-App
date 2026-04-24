import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    const response = await signIn({ email, password });
    setIsLoading(false);
    setMessage(response.message || 'Login complete.');

    if (response.success) {
      navigate('/dashboard');
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <h2>Officer Login</h2>
        <p>Use your council officer credentials to access the management portal.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <div>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </div>
          <div>
            <label>Password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {message ? <p className={message.toLowerCase().includes('failed') ? 'message error' : 'message'}>{message}</p> : null}
      </div>
    </div>
  );
}
