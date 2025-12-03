import { type FormEvent, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-white/10 via-white/5 to-black/50 p-6 text-white ring-1 ring-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
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
          {authError && <p className="text-sm text-rose-300">{authError}</p>}
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
