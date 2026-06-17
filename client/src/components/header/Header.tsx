import { useEffect, useState } from 'react';
import { apiFetch } from '../../api/client';
import './Header.scss';

const formatHeaderDate = (date: Date) =>
  date.toLocaleDateString('ro-RO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const Header: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkServer = async () => {
      try {
        const response = await apiFetch('/api/schedule', { method: 'GET' });
        setServerOnline(response.ok);
      } catch {
        setServerOnline(false);
      }
    };

    checkServer();
    const interval = setInterval(checkServer, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header__brand">
        <span className="header__mark" aria-hidden="true">✦</span>
        <div className="header__titles">
          <h1 className="header__logo">Licurici</h1>
          <p className="header__tagline">Casă de bilete</p>
        </div>
      </div>

      <div className="header__meta">
        <time className="header__date" dateTime={now.toISOString()}>
          {formatHeaderDate(now)}
        </time>

        <div
          className={`header__status ${serverOnline === false ? 'header__status--offline' : ''}`}
          title={serverOnline === false ? 'Server oprit' : 'Server activ'}
        >
          <span className="header__status-dot" aria-hidden="true" />
          <span className="header__status-text">
            {serverOnline === null ? 'Se verifică...' : serverOnline ? 'Server activ' : 'Server oprit'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
