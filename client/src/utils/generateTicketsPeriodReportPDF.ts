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
};

export const generateTicketsPeriodReportPDF = (data: TicketsPeriodReportData) => {
  const { startDate, endDate, dailyRows, totals } = data;
  const doc = new jsPDF();

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto');

  doc.setFontSize(16);
  doc.text(`Raport bilete — ${startDate} - ${endDate}`, 14, 15);

  const tableRows = dailyRows.map(r => [
    r.date.split('-').reverse().join('-'),
    String(r.tickets_received),
    String(r.sold_100_cash),
    String(r.sold_100_card),
    String(r.sold_150_cash),
    String(r.sold_150_card),
    String(r.sold_200_cash),
    String(r.sold_200_card),
    String(r.sold_total),
    `${r.amount_total} MDL`
  ]);

  autoTable(doc, {
    head: [[
      'Data', 'Primite', '100 numerar', '100 card', '150 numerar', '150 card', '200 numerar', '200 card', 'Total bilete', 'Suma'
    ]],
    body: tableRows,
    styles: { font: 'Roboto' },
    startY: 25,
  });

  const summaryStartY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text('Sumar general:', 14, summaryStartY);

  const summaryLines = [
    `Primite total: ${totals.received_total} bilete`,
    `Bilete 100 numerar: ${totals.sold_100_cash} bilete — ${totals.sold_100_cash * 100} MDL`,
    `Bilete 100 card: ${totals.sold_100_card} bilete — ${totals.sold_100_card * 100} MDL`,
    `Bilete 150 numerar: ${totals.sold_150_cash} bilete — ${totals.sold_150_cash * 150} MDL`,
    `Bilete 150 card: ${totals.sold_150_card} bilete — ${totals.sold_150_card * 150} MDL`,
    `Bilete 200 numerar: ${totals.sold_200_cash} bilete — ${totals.sold_200_cash * 200} MDL`,
    `Bilete 200 card: ${totals.sold_200_card} bilete — ${totals.sold_200_card * 200} MDL`,
    `Total bilete vandute: ${totals.sold_total} bilete`,
    `Suma totala: ${totals.amount_total} MDL`,
    `Ramas la casa: ${totals.remaining_on_box} bilete`,
  ];

  summaryLines.forEach((line, i) => {
    doc.text(line, 14, summaryStartY + 8 + i * 7);
  });

  doc.save(`raport_bilete_${startDate}_to_${endDate}.pdf`);
};

export default generateTicketsPeriodReportPDF;
