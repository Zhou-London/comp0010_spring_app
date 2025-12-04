import { type FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ErrorMessage from './ErrorMessage';

const AuthModal = () => {
  const { authOpen, closeAuth, authMode, setAuthMode, login, register, authError, clearError, setAuthError } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const modeLabel = authMode === 'login' ? 'Sign in' : 'Create account';

  if (!authOpen) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    clearError();
    try {
      if (authMode === 'login') {
        await login(username, password);
      } else {
        await register(username, password);
      }
      setUsername('');
      setPassword('');
    } catch (err) {
      if (err instanceof Error) {
        clearError();
        const friendly = err.message.includes('Invalid') ? 'Check your username/password and try again.' : err.message;
        setAuthError(friendly);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dialog-backdrop">
      <div className="dialog-panel space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">User access</p>
            <h2 className="text-2xl font-semibold">{modeLabel}</h2>
          </div>
          <button type="button" onClick={closeAuth} className="icon-button" aria-label="Close auth dialog">✖️</button>
        </div>

        <p className="mt-3 text-sm text-slate-200/80">Register with a username and password to unlock create, update, and delete actions.</p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <input
            className="field w-full"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <input
            className="field w-full"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {authError && (
            <ErrorMessage
              message={authError}
              title="Sign-in error"
              tips={[
                'Confirm your username and password are correct.',
                'If you just registered, try signing in again or resetting your password.',
                'Reach out to an administrator if you believe your account should work.',
              ]}
              floating
            />
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="icon-button accent px-5" disabled={submitting}>
              <span aria-hidden>{authMode === 'login' ? '🔒' : '✨'}</span>
              <span>{modeLabel}</span>
            </button>
            <button type="button" className="icon-button text-xs" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
              {authMode === 'login' ? 'Need an account? Register' : 'Have an account? Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
