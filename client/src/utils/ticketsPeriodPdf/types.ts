export type DailyRow = {
  date: string;
  tickets_received: number;
  number_from?: string;
  number_to?: string;
};

export type TicketsPeriodReportData = {
  startDate: string;
  endDate: string;
  dailyRows: DailyRow[];
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
    sold_from_prev?: number;
    sold_from_new?: number;
  };
  remaining_serials?: { from: string; to: string; count: number }[];
  sales_by_month?: { month: string; count: number }[];
  sales_amount_by_month?: { month: string; cash: number; card: number }[];
  beginning_serials_by_month?: {
    month: string;
    ym?: string;
    ranges: { from: string; to: string; count: number }[];
  }[];
};
