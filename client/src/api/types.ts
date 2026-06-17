export type Sale = {
  id: string;
  quantity: number;
  total_sum: number;
  payment_method: string;
  created_at: string;
  type: string;
  title: string;
  schedule_id: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  type: string;
  date: string;
  time: string;
};

export type Spectacle = {
  id: string;
  title: string;
  created_at?: string;
  type: string;
};

export type TicketEntry = {
  id: string;
  number_from: string;
  number_to: string;
  total_tickets: number;
  created_at: string;
};

export type TicketSerialPointer = {
  batch_id: number;
  current_serial_number: number | string;
};

export type TicketBatch = {
  id: number;
  number_from: number | string;
  number_to: number | string;
};

export type IntegrityResult = {
  ok: boolean;
  checkedFrom: string;
  criticalSummary: Record<string, number>;
  warningSummary: Record<string, number>;
  details: Record<string, unknown[]>;
};

export type TicketReportItem = {
  serial_number: string;
  spectacle: string;
  type: string;
  payment_method: string;
  created_at: string;
  price?: number;
};
