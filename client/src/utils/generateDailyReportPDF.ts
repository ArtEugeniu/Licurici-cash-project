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

export type DailyReportData = {
  selectedDate: string;
  filteredSales: Sale[];
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

  const summaryStartY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text(`Sumar:`, 14, summaryStartY);

  const summaryLines = [
    `Numerar: ${data.totalCashTickets} bilete — ${data.totalCashAmount} MDL`,
    `Card: ${data.totalCardTickets} bilete — ${data.totalCardAmount} MDL`,
    `Bilete 100 lei: ${data.standartTickets} bilete — ${data.standartTickets * 100} MDL`,
    `Bilete 150 lei: ${data.premieraTickets} bilete — ${data.premieraTickets * 150} MDL`,
    `Bilete 200 lei: ${data.specialTickets} bilete — ${data.specialTickets * 200} MDL`,
    `Total: ${data.totalTickets} bilete — ${data.totalAmount} MDL`,
  ];

  summaryLines.forEach((line, i) => {
    doc.text(line, 14, summaryStartY + 8 + i * 7);
  });

  doc.save(`raport_zilnic_${data.selectedDate}.pdf`);
};
