import { apiGet, apiPost } from './client';
import type { Sale } from './types';

export type CreateSalePayload = {
  id: string;
  quantity: number;
  payment_method: string;
  total_sum: number;
  type: string;
  title: string;
  schedule_id: string;
  print: {
    title: string;
    date: string;
    time: string;
    price: string;
  };
};

export const salesApi = {
  getAll: () => apiGet<Sale[]>('/api/sales'),
  create: (payload: CreateSalePayload) => apiPost('/api/sales', payload),
};
