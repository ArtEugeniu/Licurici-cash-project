import { useState } from 'react';
import { getApiErrorMessage } from '../../../api/client';
import { ticketsApi } from '../../../api/ticketsApi';
import IntegrityDetails from './IntegrityDetails';
import type { IntegrityResult } from '../../../api/types';

const integrityLabels: Record<string, string> = {
  salesSerialMismatches: 'Vânzări fără număr corect de serii',
  orphanTicketSales: 'Serii legate de vânzări inexistente',
  duplicateSerials: 'Serii duplicate în același lot',
  ticketSerialWithoutBatch: 'Serii fără lot înregistrat',
  serialPointersWithoutBatch: 'Serii fără lot înregistrat',
  batchesWithoutSerialPointer: 'Loturi fără serii generate',
  invalidTicketRanges: 'Loturi cu interval invalid',
  overlappingTicketRanges: 'Intervale suprapuse',
};

const IntegrityCheck: React.FC = () => {
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [integrityLoading, setIntegrityLoading] = useState<boolean>(false);
  const [integrityError, setIntegrityError] = useState<string>('');
  const [expandedIntegrityKey, setExpandedIntegrityKey] = useState<string | null>(null);

  const checkIntegrity = async () => {
    setIntegrityLoading(true);
    setIntegrityError('');

    try {
      const data = await ticketsApi.checkIntegrity('2025-10-01');
      setIntegrityResult(data);
      setExpandedIntegrityKey(null);
    } catch (error) {
      setIntegrityError(getApiErrorMessage(error, 'Eroare la verificarea bazei'));
      setIntegrityResult(null);
      setExpandedIntegrityKey(null);
    } finally {
      setIntegrityLoading(false);
    }
  };
  return (
    <section className="card tickets__integrity">
      <div className="tickets__integrity-header">
        <h3 className="tickets__integrity-title">Verificare bază</h3>
        <button className="btn" onClick={checkIntegrity} disabled={integrityLoading}>
          {integrityLoading ? 'Se verifică...' : 'Verifică'}
        </button>
      </div>

      {integrityError && <p className="tickets__integrity-error">{integrityError}</p>}

      {integrityResult && (
        <div className="tickets__integrity-result">
          <p className={`tickets__integrity-status ${integrityResult.ok ? 'tickets__integrity-status-ok' : 'tickets__integrity-status-error'}`}>
            Status: {integrityResult.ok ? 'OK' : 'Probleme critice'}
          </p>

          <table className="table">
            <thead>
              <tr>
                <th>Tip</th>
                <th>Verificare</th>
                <th>Rezultat</th>
                <th>Detalii</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(integrityResult.criticalSummary).map(([key, value]) => (
                <tr key={key}>
                  <td>Critic</td>
                  <td>{integrityLabels[key] || key}</td>
                  <td>{value}</td>
                  <td>
                    {value > 0 && (
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setExpandedIntegrityKey(expandedIntegrityKey === key ? null : key)}
                      >
                        {expandedIntegrityKey === key ? 'Ascunde' : 'Detalii'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {Object.entries(integrityResult.warningSummary).map(([key, value]) => (
                <tr key={key}>
                  <td>Atenție</td>
                  <td>{integrityLabels[key] || key}</td>
                  <td>{value}</td>
                  <td>
                    {value > 0 && (
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => setExpandedIntegrityKey(expandedIntegrityKey === key ? null : key)}
                      >
                        {expandedIntegrityKey === key ? 'Ascunde' : 'Detalii'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {expandedIntegrityKey && (
            <div className="tickets__integrity-details">
              <h4 className="tickets__integrity-details-title">
                Detalii: {integrityLabels[expandedIntegrityKey] || expandedIntegrityKey}
              </h4>
              <div className="table-scroll">
                <IntegrityDetails
                  integrityResult={integrityResult}
                  expandedIntegrityKey={expandedIntegrityKey}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default IntegrityCheck;
