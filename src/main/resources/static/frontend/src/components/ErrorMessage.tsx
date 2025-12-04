import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface ErrorMessageProps {
  message: string;
  title?: string;
  tips?: string[];
  children?: ReactNode;
  floating?: boolean;
}

const defaultTips = [
  'Double-check the information you entered for typos or missing fields.',
  'Make sure you are signed in and have permission to complete this action.',
  'If the issue persists, refresh the page and try again.',
];

const ErrorMessage = ({ message, title = 'Error', tips = defaultTips, children, floating = false }: ErrorMessageProps) => {
  if (!message) return null;

  const content = (
    <div className={`error-pop${floating ? ' error-pop--floating' : ''}`} role="alert" aria-live="assertive">
      <div className="error-pop__icon" aria-hidden>
        ⚠️
      </div>
      <div className="error-pop__body">
        <p className="error-pop__title">{title}</p>
        <p className="error-pop__message">{message}</p>
        {children}
        {tips.length > 0 && (
          <ul className="error-pop__tips">
            {tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  if (floating) {
    return createPortal(content, document.body);
  }

  return content;
};

export default ErrorMessage;
