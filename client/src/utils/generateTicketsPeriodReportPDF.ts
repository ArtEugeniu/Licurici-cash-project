import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegularBase64 } from '../fonts/Roboto-Regular-normal';
import { RobotoBoldBase64 } from '../fonts/Roboto-Regular-bold';

export function registerRobotoFont(jsPDFInstance: typeof jsPDF) {
  jsPDFInstance.API.events.push([
    'addFonts',
    function (this: jsPDF) {
      this.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
      this.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

      this.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
      this.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
    },
  ]);
}

registerRobotoFont(jsPDF);

type DailyRow = {
  date: string;
  tickets_received: number;
  sold_100_cash: number;
  sold_100_card: number;
  sold_150_cash: number;
  sold_150_card: number;
  sold_200_cash: number;
  sold_200_card: number;
  sold_total: number;
  amount_total: number;
};

type TicketsPeriodReportData = {
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
    remaining_on_box: number;
  };
  generated_at: string;
  meta?: {
    beginning_inventory?: number;
    sold_from_prev?: number;
    sold_from_new?: number;
  };
};

export const generateTicketsPeriodReportPDF = (data: TicketsPeriodReportData) => {
  const { startDate, endDate, dailyRows, totals, meta } = data as any;
  const fmtDate = (s?: string) => {
    if (!s) return '';
    const parts = String(s).split('-');
    if (parts.length >= 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return s;
  };
  // Create PDF in landscape (альбом) orientation
  const doc = new jsPDF({ format: 'a4', orientation: 'landscape' });

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto');

  doc.setFontSize(16);
  doc.text(`Raport bilete — ${fmtDate(startDate)} - ${fmtDate(endDate)}`, 14, 15);

  // First table: beginning inventory + individual ticket receipts (with serials) + total at box in period
  const firstTableRows: string[][] = [];
  if (meta && (meta.beginning_inventory || meta.beginning_inventory === 0)) {
    // Romanian: "Stoc inițial" (остаток на начало периода)
    firstTableRows.push([ 'Stoc inițial', '', '', String(meta.beginning_inventory) ]);
  }

  for (const r of dailyRows) {
    // r.date expected as YYYY-MM-DD; r.number_from/number_to may be strings
    const d = r.date ? r.date.split('-').reverse().join('-') : '';
    firstTableRows.push([ d, String(r.number_from || ''), String(r.number_to || ''), String(r.tickets_received) ]);
  }

  // Add total tickets available at box-office during period row
  // Romanian: "Total la casă în perioadă" = beginning_inventory + received_total
  const beginning = (meta && meta.beginning_inventory) ? Number(meta.beginning_inventory) : 0;
  const totalAtBox = beginning + (totals.received_total || 0);
  firstTableRows.push([ 'Total la casă în perioadă', '', '', String(totalAtBox) ]);

  autoTable(doc, {
    head: [[ 'Data', 'Seria de la', 'Seria pana la', 'Bilete' ]],
    body: firstTableRows,
    styles: { font: 'Roboto' },
    startY: 25,
  });

  const secondStartY = (doc as any).lastAutoTable.finalY + 10;
  const salesTableRows = [
    ['100 numerar', String(totals.sold_100_cash), String(totals.sold_100_cash * 100) + ' MDL'],
    ['100 card', String(totals.sold_100_card), String(totals.sold_100_card * 100) + ' MDL'],
    ['150 numerar', String(totals.sold_150_cash), String(totals.sold_150_cash * 150) + ' MDL'],
    ['150 card', String(totals.sold_150_card), String(totals.sold_150_card * 150) + ' MDL'],
    ['200 numerar', String(totals.sold_200_cash), String(totals.sold_200_cash * 200) + ' MDL'],
    ['200 card', String(totals.sold_200_card), String(totals.sold_200_card * 200) + ' MDL'],
  ];

  autoTable(doc, {
    head: [[ 'Tip / Metoda', 'Bilete', 'Suma' ]],
    body: salesTableRows,
    styles: { font: 'Roboto' },
    startY: secondStartY,
  });

  const summaryStartY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  const summaryLines = [
    `Total primite: ${totals.received_total} bilete`,
    `Total bilete vândute: ${totals.sold_total} bilete`,
    `Suma totală: ${totals.amount_total} MDL`,
    `Rămase la casă: ${totals.remaining_on_box} bilete`,
  ];

  summaryLines.forEach((line, i) => {
    doc.text(line, 14, summaryStartY2 + i * 7);
  });

  doc.save(`raport_bilete_${fmtDate(startDate)}_to_${fmtDate(endDate)}.pdf`);
};

export default generateTicketsPeriodReportPDF;
