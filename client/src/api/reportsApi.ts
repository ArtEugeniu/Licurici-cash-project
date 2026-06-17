import { apiGet } from './client';
import type { TicketReportItem } from './types';
import type { TicketsPeriodReportData } from '../views/ticketsView/components/ticketsPeriodReportTypes';

export const reportsApi = {
  getTicketReport: (startDate: string, endDate: string) =>
    apiGet<TicketReportItem[]>(`/api/ticketsReport?startDate=${startDate}&endDate=${endDate}`),
  getTicketsPeriodReport: (startDate: string, endDate: string) =>
    apiGet<TicketsPeriodReportData>(`/api/reports/tickets_period?startDate=${startDate}&endDate=${endDate}`),
};
