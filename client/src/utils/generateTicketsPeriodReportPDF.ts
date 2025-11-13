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
  const doc = new jsPDF();

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto');

  doc.setFontSize(16);
  doc.text(`Raport bilete — ${startDate} - ${endDate}`, 14, 15);

  // First table: sold from previous stock + ticket receipts by date + sold total for period row
  const firstTableRows: string[][] = [];
  if (meta && (meta.sold_from_prev || meta.sold_from_prev === 0)) {
    firstTableRows.push([ 'Sold from previous stock', String(meta.sold_from_prev) ]);
  }

  for (const r of dailyRows) {
    firstTableRows.push([ r.date.split('-').reverse().join('-'), String(r.tickets_received) ]);
  }

  // Add sold total for period row
  firstTableRows.push([ 'Sold total for period', String(totals.sold_total) ]);

  autoTable(doc, {
    head: [[ 'Data / Note', 'Bilete' ]],
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
    `Primite total: ${totals.received_total} bilete`,
    `Total bilete vandute: ${totals.sold_total} bilete`,
    `Suma totala: ${totals.amount_total} MDL`,
    `Ramas la casa: ${totals.remaining_on_box} bilete`,
  ];

  summaryLines.forEach((line, i) => {
    doc.text(line, 14, summaryStartY2 + i * 7);
  });

  doc.save(`raport_bilete_${startDate}_to_${endDate}.pdf`);
};

export default generateTicketsPeriodReportPDF;
