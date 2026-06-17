export interface TicketEntry {
  id: string;
  number_from: string;
  number_to: string;
  total_tickets: number;
  created_at: string;
}

export type IntegrityResult = {
  ok: boolean;
  checkedFrom: string;
  criticalSummary: Record<string, number>;
  warningSummary: Record<string, number>;
  details: Record<string, any[]>;
};
