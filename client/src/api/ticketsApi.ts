import { apiGet, apiPost } from './client';
import type { IntegrityResult, TicketBatch, TicketEntry, TicketSerialPointer } from './types';

export type CreateTicketBatchPayload = {
  firstSerial: string;
  lastSerial: string;
  ticketsNumber: string;
};

export const ticketsApi = {
  getReceived: () => apiGet<TicketEntry[]>('/api/tickets_in'),
  createBatch: (payload: CreateTicketBatchPayload) => apiPost('/api/tickets_in', payload),
  getSerialPointers: () => apiGet<TicketSerialPointer[]>('/api/ticket_serial'),
  getBatches: () => apiGet<TicketBatch[]>('/api/tickets_in'),
  getRemaining: <T>() => apiGet<T>('/api/ticket_serial/remaining'),
  checkIntegrity: (fromDate: string) => apiGet<IntegrityResult>(`/api/integrity?fromDate=${fromDate}`),
};
