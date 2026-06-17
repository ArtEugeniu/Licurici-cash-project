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

type Sale = {
  id: string;
  quantity: number;
  total_sum: number;
  payment_method: string;
  created_at: string;
  type: string;
  title: string
};

export type SpectacleDailySummary = {
  title: string;
  scheduleLabel: string;
  tickets: number;
  amount: number;
  cashTickets: number;
  cashAmount: number;
  cardTickets: number;
  cardAmount: number;
};

export const formatSpectacleSummaryLine = (item: SpectacleDailySummary): string => {
  const schedulePart = item.scheduleLabel ? ` (${item.scheduleLabel})` : '';
  const ticketLabel = item.tickets === 1 ? 'bilet' : 'bilete';
  const cashLabel = item.cashTickets === 1 ? 'bilet' : 'bilete';
  const cardLabel = item.cardTickets === 1 ? 'bilet' : 'bilete';

  return `${item.title}${schedulePart} — ${item.tickets} ${ticketLabel} — ${item.amount} MDL (numerar: ${item.cashTickets} ${cashLabel} — ${item.cashAmount} MDL, card: ${item.cardTickets} ${cardLabel} — ${item.cardAmount} MDL)`;
};

export type DailyReportData = {
  selectedDate: string;
  filteredSales: Sale[];
  spectacleSummaries: SpectacleDailySummary[];
  totalCashTickets: number;
  totalCashAmount: number;
  totalCardTickets: number;
  totalCardAmount: number;
  premieraTickets: number;
  standartTickets: number;
  specialTickets: number;
  totalTickets: number;
  totalAmount: number;
};

registerRobotoFont(jsPDF);

export const generateDailyReportPDF = (data: DailyReportData) => {
  const doc = new jsPDF();

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  
  doc.setFont('Roboto');

  doc.setFontSize(16);
  doc.text(`Raport zilnic — ${data.selectedDate}`, 14, 15);

  const tableRows = data.filteredSales.map((sale) => [
    new Date(sale.created_at).toLocaleDateString(),
    sale.title ?? '—',
    sale.quantity.toString(),
    `${sale.total_sum} MDL`,
    sale.payment_method === 'cash' ? 'Numerar' : 'Card',
  ]);

  autoTable(doc, {
    head: [['Data', 'Spectacol', 'Bilete', 'Suma', 'Metodă plată']],
    styles: { font: 'Roboto' },
    body: tableRows,
    startY: 25,
  });

  let nextY = (doc as any).lastAutoTable.finalY + 10;

  if (data.spectacleSummaries.length > 0) {
    doc.setFontSize(12);
    doc.setFont('Roboto', 'bold');
    doc.text('Vânzări pe spectacole:', 14, nextY);
    doc.setFont('Roboto', 'normal');

    let lineOffset = 8;
    data.spectacleSummaries.forEach((item) => {
      const line = formatSpectacleSummaryLine(item);
      const wrapped = doc.splitTextToSize(line, 180);
      doc.text(wrapped, 14, nextY + lineOffset);
      lineOffset += wrapped.length * 7;
    });

    nextY += lineOffset + 6;
  }

  doc.setFontSize(12);
  doc.setFont('Roboto', 'bold');
  doc.text('Sumar:', 14, nextY);
  doc.setFont('Roboto', 'normal');

  const summaryLines = [
    `Numerar: ${data.totalCashTickets} bilete — ${data.totalCashAmount} MDL`,
    `Card: ${data.totalCardTickets} bilete — ${data.totalCardAmount} MDL`,
    `Bilete 100 lei: ${data.standartTickets} bilete — ${data.standartTickets * 100} MDL`,
    `Bilete 150 lei: ${data.premieraTickets} bilete — ${data.premieraTickets * 150} MDL`,
    `Bilete 200 lei: ${data.specialTickets} bilete — ${data.specialTickets * 200} MDL`,
    `Total: ${data.totalTickets} bilete — ${data.totalAmount} MDL`,
  ];

  summaryLines.forEach((line, i) => {
    doc.text(line, 14, nextY + 8 + i * 7);
  });

  doc.save(`raport_zilnic_${data.selectedDate}.pdf`);
};
