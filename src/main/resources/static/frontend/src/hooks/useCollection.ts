import { useCallback, useEffect, useState } from "react";
import { fetchCollection } from "../api/client";

interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useCollection<T>(path: string): CollectionState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchCollection<T>(path);
      setData(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to fetch data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
