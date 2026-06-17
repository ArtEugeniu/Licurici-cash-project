import { apiDelete, apiGet, apiPost } from './client';
import type { Spectacle } from './types';

export type CreateSpectaclePayload = {
  id: string;
  title: string;
  type: string;
};

export const spectaclesApi = {
  getAll: () => apiGet<Spectacle[]>('/api/spectacles'),
  create: (payload: CreateSpectaclePayload) => apiPost<Spectacle[]>('/api/spectacles', payload),
  remove: (id: string) => apiDelete<Spectacle[]>(`/api/spectacles/${id}`),
};
