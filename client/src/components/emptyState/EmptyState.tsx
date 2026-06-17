import type { ReactNode } from 'react';

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: ReactNode;
};

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  icon = '◌',
}) => {
  return (
    <div className="empty-state" role="status">
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <h3 className="empty-state__title">{title}</h3>
      {message && <p className="empty-state__message">{message}</p>}
    </div>
  );
};

export default EmptyState;
