import { apiDelete, apiGet, apiPost, apiPut } from './client';
import type { ScheduleItem } from './types';

export type CreateSchedulePayload = {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
};

export type UpdateSchedulePayload = {
  title: string;
  type: string;
};

export const scheduleApi = {
  getAll: () => apiGet<ScheduleItem[]>('/api/schedule'),
  create: (payload: CreateSchedulePayload) => apiPost('/api/schedule', payload),
  update: (id: string, payload: UpdateSchedulePayload) => apiPut(`/api/schedule/${id}`, payload),
  remove: (id: string) => apiDelete(`/api/schedule/${id}`),
};
