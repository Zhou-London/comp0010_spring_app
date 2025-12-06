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
    <div className="glass-panel p-4 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-end gap-2">
      </div>

      {latestLog && (
        <div
          key={latestLog.id}
          className="surface-card px-4 py-3 flex items-center justify-between gap-4"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-primary">
              {latestLog.description || `${latestLog.operationType} ${latestLog.entityType}`}
            </p>
            <p className="text-xs text-secondary">
              {formatTimestamp(latestLog.timestamp)}
              {latestLog.username ? ` · by ${latestLog.username}` : ''}
            </p>
          </div>
          {latestLog.operationType !== 'REVERT' && (
            <button
              type="button"
              className="icon-button danger compact px-3 py-1 text-xs"
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
