import { useEffect, useState } from 'react';
import { API_BASE } from '../api';
import { MoonIcon, SunIcon } from './Icons';

const ServerStatus = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/students`);
        setIsOnline(response.ok);
      } catch (error) {
        setIsOnline(false);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      void checkServerStatus();
    }, 500); // Delay to avoid flickering

    return () => clearTimeout(timer);
  }, []);

  const cardClasses =
    'surface-card p-3 flex items-center gap-3 transition-all duration-300 ease-in-out';
  const textClasses = 'text-sm font-semibold';

  if (loading) {
    return (
      <div className={cardClasses}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
        <span className={`${textClasses} text-slate-400`}>Checking status...</span>
      </div>
    );
  }

  return (
    <div className={cardClasses}>
      {isOnline ? (
        <>
          <SunIcon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
          <span className={textClasses} style={{ color: 'var(--accent)' }}>
            Backend Connected
          </span>
        </>
      ) : (
        <>
          <MoonIcon className="h-5 w-5" style={{ color: 'var(--error-bullet)' }} />
          <span className={textClasses} style={{ color: 'var(--error-bullet)' }}>
            Backend Disconnected. Check port 2800.
          </span>
        </>
      )}
    </div>
  );
};

export default ServerStatus;
