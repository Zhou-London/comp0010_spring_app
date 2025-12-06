import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { type OperationLog } from '../types';

interface OperationLogPanelProps {
  refreshToken: number;
  onReverted?: () => void;
}

const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (err) {
    return timestamp;
  }
};

const OperationLogPanel = ({ refreshToken, onReverted }: OperationLogPanelProps) => {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [revertingId, setRevertingId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<OperationLog[]>('/operations');
      setLogs(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load operation history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [refreshToken]);

  const revertOperation = async (id?: number) => {
    if (!id) return;
    setRevertingId(id);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/operations/${id}/revert`, { method: 'POST' });
      setMessage('Operation reverted successfully.');
      await fetchLogs();
      onReverted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revert operation');
    } finally {
      setRevertingId(null);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/20 ring-1 ring-white/10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--text-secondary)]">Recent admin operations</p>
          <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">History & reverts</h3>
          <p className="text-sm text-[color:var(--text-muted)]">Every create, update, and delete action appears here with a quick undo.</p>
        </div>
        <button
          type="button"
          className="icon-button text-xs"
          onClick={() => void fetchLogs()}
          aria-label="Refresh operation history"
        >
          <span aria-hidden>⟳</span>
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading && <p className="mt-3 text-sm text-[color:var(--text-secondary)]">Loading activity…</p>}
      {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}
      {error && <p className="mt-3 text-sm text-amber-300">{error}</p>}

      <div className="mt-3 space-y-2 max-h-80 overflow-auto pr-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-start justify-between gap-3 rounded-2xl bg-black/30 px-3 py-2 ring-1 ring-white/10"
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-[color:var(--text-primary)]">
                {log.description || `${log.operationType} ${log.entityType}`}
              </p>
              <p className="text-xs text-[color:var(--text-muted)]">
                {log.operationType} · {log.entityType} #{log.entityId ?? '–'} · {formatTimestamp(log.timestamp)}
                {log.username ? ` · by ${log.username}` : ''}
              </p>
            </div>
            {log.operationType !== 'REVERT' && (
              <button
                type="button"
                className="icon-button compact text-[10px] px-2 py-1"
                onClick={() => void revertOperation(log.id)}
                disabled={revertingId === log.id}
                aria-label="Revert operation"
              >
                <span aria-hidden>↩</span>
                <span className="hidden sm:inline">Revert</span>
              </button>
            )}
          </div>
        ))}
        {!logs.length && !loading && (
          <p className="text-sm text-[color:var(--text-secondary)]">No admin operations recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default OperationLogPanel;
