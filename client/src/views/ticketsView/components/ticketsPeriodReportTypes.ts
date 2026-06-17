export type TicketsPeriodDailyRow = {
  id?: number;
  date: string;
  tickets_received: number;
  number_from?: string;
  number_to?: string;
};

export type TicketsPeriodRange = {
  from: string;
  to: string;
  count: number;
};

export type TicketsPeriodReportData = {
  startDate: string;
  endDate: string;
  dailyRows: TicketsPeriodDailyRow[];
  totals: {
    received_total: number;
    sold_100_cash: number;
    sold_100_card: number;
    sold_150_cash: number;
    sold_150_card: number;
    sold_200_cash: number;
    sold_200_card: number;
    sold_total: number;
    amount_total: number;
    amount_cash?: number;
    amount_card?: number;
    remaining_on_box: number;
  };
  generated_at: string;
  meta?: {
    beginning_inventory?: number;
  };
  beginning_serials_by_month?: {
    month: string;
    ranges: TicketsPeriodRange[];
  }[];
  remaining_serials?: TicketsPeriodRange[];
  sales_by_month?: { month: string; count: number }[];
  sales_amount_by_month?: { month: string; cash: number; card: number }[];
};
