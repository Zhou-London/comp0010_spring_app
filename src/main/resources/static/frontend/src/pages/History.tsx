import { useEffect, useState } from 'react';
import { apiFetch, unwrapCollection, type CollectionResponse } from '../api';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { type OperationLog } from '../types';

const History = () => {
  const { requireAuth } = useAuth();
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reverting, setReverting] = useState<number | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiFetch<CollectionResponse<OperationLog>>('/operations');
      setLogs(unwrapCollection(response, 'operationLogs'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, []);

  const revertOperation = async (logId: number) => {
    setReverting(logId);
    try {
      await apiFetch(`/operations/${logId}/revert`, { method: 'POST' });
      await fetchLogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to revert operation');
    } finally {
      setReverting(null);
    }
  };

  const renderLog = (log: OperationLog) => {
    const timestamp = new Date(log.timestamp ?? '').toLocaleString();
    const isReverting = reverting === log.id;

    return (
      <div key={log.id} className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs uppercase tracking-[0.2em] text-slate-300">
            {log.entityType} #{log.entityId}
          </span>
          <span className="text-xs text-slate-400">{timestamp}</span>
        </div>
        <p className="mt-2 text-sm text-slate-200">
          <span className="font-semibold text-white">{log.username}</span> performed{' '}
          <span className="font-semibold text-white">{log.operationType}</span>
        </p>
        {log.operationType !== 'REVERT' && (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => requireAuth(() => revertOperation(log.id ?? 0))}
              disabled={isReverting}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200 ring-1 ring-white/20 transition hover:bg-white/20 disabled:opacity-50"
            >
              {isReverting ? 'Reverting…' : 'Revert'}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel">
      <div className="flex flex-col gap-8 p-8 sm:p-10">
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-300">History</p>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Operation Log</h1>
          <p className="text-slate-200/80">A complete log of all administrative actions.</p>
        </div>
        {error && <ErrorMessage message={error} title="Error loading history" />}
        {loading ? (
          <p className="text-slate-300">Loading history...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {logs.map(renderLog)}
            {logs.length === 0 && <p className="text-slate-300">No operations recorded yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
