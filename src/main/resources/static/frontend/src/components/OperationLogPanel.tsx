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
  const [revertingId, setRevertingId] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiFetch<OperationLog[]>('/operations');
      setLogs(response);
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
    try {
      await apiFetch(`/operations/${id}/revert`, { method: 'POST' });
      await fetchLogs();
      onReverted?.();
    } finally {
      setRevertingId(null);
    }
  };

  const latestLog = logs[0];

  if (!latestLog && !loading) return null;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-inner shadow-black/20 ring-1 ring-white/10">
      <div className="flex flex-wrap items-center justify-end gap-2">
      </div>

      {latestLog && (
        <div
          key={latestLog.id}
          className="flex items-start justify-between gap-3 rounded-2xl bg-black/30 px-3 py-2 ring-1 ring-white/10"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-[color:var(--text-primary)]">
              {latestLog.description || `${latestLog.operationType} ${latestLog.entityType}`}
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">
              {formatTimestamp(latestLog.timestamp)}
              {latestLog.username ? ` · by ${latestLog.username}` : ''}
            </p>
          </div>
          {latestLog.operationType !== 'REVERT' && (
            <button
              type="button"
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full px-3 py-1 text-xs font-semibold"
              onClick={() => void revertOperation(latestLog.id)}
              disabled={revertingId === latestLog.id}
              aria-label="Revert operation"
            >
              ↩ Revert
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OperationLogPanel;
