// frontend/src/components/auth/TwoFactorAuth.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../shared/Alert';

const TwoFactorAuth = () => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyTwoFactor, tempUserId } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyTwoFactor(token, tempUserId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please enter the verification code from your authenticator app
          </p>
        </div>
        
        {error && <Alert type="error" message={error} />}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <Input
                id="token"
                name="token"
                type="text"
                required
                placeholder="Authentication code"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="rounded-md"
                autoComplete="off"
                autoFocus
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              fullWidth
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorAuth;
