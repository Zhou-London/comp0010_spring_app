import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import ErrorMessage from '../components/ErrorMessage';

type ErrorPayload = {
  title?: string;
  message: string;
  tips?: string[];
};

interface ErrorContextValue {
  showError: (payload: ErrorPayload) => void;
  clearError: () => void;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<ErrorPayload | null>(null);

  const contextValue = useMemo<ErrorContextValue>(
    () => ({
      showError: (payload) => setError(payload),
      clearError: () => setError(null),
    }),
    [],
  );

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
      {error && (
        <ErrorMessage
          floating
          title={error.title}
          message={error.message}
          tips={error.tips}
          onDismiss={() => contextValue.clearError()}
        />
      )}
    </ErrorContext.Provider>
  );
};

export const useErrorOverlay = () => {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error('useErrorOverlay must be used within ErrorProvider');
  return ctx;
};

