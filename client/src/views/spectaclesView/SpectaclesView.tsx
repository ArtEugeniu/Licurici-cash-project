import './Spectaclesview.scss';
import { useEffect, useState } from 'react';
import EmptyState from '../../components/emptyState/EmptyState';
import { getApiErrorMessage } from '../../api/client';
import { scheduleApi } from '../../api/scheduleApi';
import { spectaclesApi } from '../../api/spectaclesApi';
import type { Spectacle } from '../../api/types';
import { notifyError, notifySuccess } from '../../utils/toast';
import SpectaclesViewModal from './SpectacleViewModal';
import SpectaclesViewAddModal from './SpectaclesViewAddModal';
import { v4 as uuid } from 'uuid';

interface ScheduleData {
  title: string
  time: string
  type: string
  date: string
}

const SpectaclesView: React.FC = () => {
  const [spectacles, setSpectacles] = useState<Spectacle[]>([]);
  const [showModalNew, setShowModalNew] = useState<boolean>(false);
  const [showModalAdd, setShowModalAdd] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [filteredSpectacles, setFilteredSpectacles] = useState<Spectacle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAddingToSchedule, setIsAddingToSchedule] = useState<boolean>(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    title: '',
    time: '',
    type: '',
    date: ''
  });

  const fetchSpectacles = async () => {
    setLoading(true);

    try {
      const data = await spectaclesApi.getAll();
      setSpectacles(data);
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la încărcarea spectacolelor'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchSpectacles();
  }, []);

  useEffect(() => {
    const filtered = spectacles.filter(item => {
      return item.title.toLocaleLowerCase().includes(search.toLocaleLowerCase());
    });
    setFilteredSpectacles(search === '' ? spectacles : filtered);
  }, [spectacles, search]);

  const handleAddSpectacle = async (title: string, type: string) => {
    try {
      const data = await spectaclesApi.create({ id: uuid(), title, type });
      setSpectacles(data);
      setShowModalNew(false);
      notifySuccess('Spectacolul a fost adăugat');
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la adăugarea spectacolului'));
    }
  };
  const handleDeleteSpectacle = async (id: string) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }

    try {
      const data = await spectaclesApi.remove(id);
      setSpectacles(data);
      notifySuccess('Spectacolul a fost șters');
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la ștergerea spectacolului'));
    } finally {
      setPendingDeleteId(null);
    }
  };
  const handleCancelAddToSchedule = () => {
    setShowModalAdd(false);
  };

  const handleAddToSchedule = async () => {
    const date = scheduleData.date;
    const time = scheduleData.time;

    if (!isValidDate(String(date))) {
      notifyError('Introduceți data corectă');
      return;
    }

    if (isDateInPast(String(date))) {
      notifyError('Introduceți data corectă');
      return;
    }

    if (!isValidTime(String(time))) {
      notifyError('Introduceți ora corectă');
      return;
    }

    setIsAddingToSchedule(true);

    try {
      await scheduleApi.create({
        id: uuid(),
        title: scheduleData.title,
        type: scheduleData.type,
        date: scheduleData.date,
        time: scheduleData.time,
      });

      setShowModalAdd(false);
      notifySuccess('Spectacolul a fost adăugat în program');
    } catch (error) {
      notifyError(getApiErrorMessage(error, 'Eroare la adăugarea spectacolului în program'));
    } finally {
      setIsAddingToSchedule(false);
    }
  };
  function isValidDate(dateStr: string) {
    if (!dateStr) return false;

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;

    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }

  function isDateInPast(dateStr: string): boolean {
    if (!dateStr) return false;

    const inputDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return inputDate < today;
  }

  function isValidTime(timeStr: string): boolean {
    if (!timeStr) return false;

    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(timeStr);
  }

  return (
    <div className="spectacles page">
      <h2 className="page-title">Spectacole</h2>
      <button className="btn btn--lg" onClick={() => setShowModalNew(true)}>Spectacol nou</button>
      <label className="spectacles__search-label field" htmlFor="spectacle-search">
        <span className="field__label">Caută spectacol</span>
        <input
          className="input spectacles__search"
          type="search"
          id="spectacle-search"
          placeholder="Caută spectacol"
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
      </label>
      {showModalNew && <SpectaclesViewModal onCancel={() => setShowModalNew(false)} onAdd={handleAddSpectacle} />}
      {showModalAdd && (
        <SpectaclesViewAddModal
          scheduleData={scheduleData}
          setScheduleData={setScheduleData}
          onAccept={handleAddToSchedule}
          onCancel={handleCancelAddToSchedule}
          isSubmitting={isAddingToSchedule}
        />
      )}
      {loading ? (
        <p className="app-status app-status--loading">Se încarcă spectacolele...</p>
      ) : filteredSpectacles.length === 0 ? (
        <EmptyState
          title={search ? 'Niciun rezultat' : 'Nu există spectacole'}
          message={
            search
              ? `Nu s-a găsit niciun spectacol pentru „${search}".`
              : 'Adăugați primul spectacol folosind butonul de mai sus.'
          }
        />
      ) : (
        <ul className="spectacles__list">
          {filteredSpectacles.map(item => {
            const isPendingDelete = pendingDeleteId === item.id;

            return (
              <li className="spectacles__item card" key={item.id}>
                <h3 className="spectacles__name">
                  {item.title}{' '}
                  <span>{item.type === 'Premiera' ? '(Premiera)' : ''}</span>
                </h3>
                <div className="spectacles__actions">
                  <button
                    className="btn btn--sm"
                    onClick={() => {
                      setShowModalAdd(true);
                      setScheduleData({ title: item.title, type: item.type, date: '', time: '' });
                    }}
                  >
                    Adaugă
                  </button>
                  <button
                    className={`btn btn--sm ${isPendingDelete ? 'btn--danger' : 'btn--secondary'}`}
                    onClick={() => handleDeleteSpectacle(item.id)}
                  >
                    {isPendingDelete ? 'Confirmați?' : 'Șterge'}
                  </button>
                  {isPendingDelete && (
                    <button className="btn btn--ghost btn--sm" onClick={() => setPendingDeleteId(null)}>
                      Anulează
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default SpectaclesView;
