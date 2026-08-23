import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import api from '../services/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');
  const hasRequested = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Verification token is missing. Please check your email link.');
      return;
    }

    const verifyToken = async () => {
      if (hasRequested.current) return;
      hasRequested.current = true;
      
      try {
        const res = await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Your email has been verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center min-vh-100">
      <div className="glass-panel p-5 text-center w-100" style={{ maxWidth: '480px' }}>
        {status === 'verifying' && (
          <div className="py-4">
            <Loader2 className="text-danger animate-spin mx-auto mb-3" size={48} style={{ animation: 'spin 2s linear infinite' }} />
            <h3 className="font-display fw-bold mb-2">Verifying Your Email</h3>
            <p className="text-secondary">Please wait while we validate your activation token...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <ShieldCheck className="text-success mx-auto mb-3" size={54} />
            <h3 className="font-display fw-bold mb-2 text-success">Verification Complete</h3>
            <p className="text-secondary mb-4">{message}</p>
            <Link to="/login" className="btn btn-netflix px-4 py-2">
              Proceed to Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <ShieldAlert className="text-danger mx-auto mb-3" size={54} />
            <h3 className="font-display fw-bold mb-2 text-danger">Verification Failed</h3>
            <p className="text-secondary mb-4">{message}</p>
            <div className="d-flex gap-2 justify-content-center">
              <Link to="/login" className="btn btn-glass px-4">
                Back to Sign In
              </Link>
              <Link to="/register" className="btn btn-netflix px-4">
                Create New Account
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
