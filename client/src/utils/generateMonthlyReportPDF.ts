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

export type MonthlyReportData = {
  selectedMonth: string;
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

export const generateMonthlyReportPDF = (data: MonthlyReportData) => {
  const {
    selectedMonth,
    filteredSales,
    totalCashTickets,
    totalCashAmount,
    totalCardTickets,
    totalCardAmount,
    premieraTickets,
      specialTickets,
    standartTickets,
    totalTickets,
    totalAmount,
  } = data;

  const doc = new jsPDF();

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.setFont('Roboto');

  doc.setFontSize(16);
  doc.text(`Raport lunar — ${selectedMonth}`, 14, 15);


  const groupedByShow = filteredSales.reduce<Record<string, { tickets: number; amount: number }>>((acc, sale) => {
    const title = sale.title ?? '—';
    if (!acc[title]) acc[title] = { tickets: 0, amount: 0 };
    acc[title].tickets += sale.quantity;
    acc[title].amount += sale.total_sum;
    return acc;
  }, {});

  const tableRows = Object.entries(groupedByShow).map(([title, info]) => [
    title,
    info.tickets.toString(),
    `${info.amount} MDL`
  ]);

  autoTable(doc, {
    head: [['Spectacol', 'Nr. bilete', 'Suma']],
    styles: { font: 'Roboto' },
    body: tableRows,
    startY: 25,
  });

  const summaryStartY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text('Sumar general:', 14, summaryStartY);

  const summaryLines = [
    `Numerar: ${totalCashTickets} bilete — ${totalCashAmount} MDL`,
    `Card: ${totalCardTickets} bilete — ${totalCardAmount} MDL`,
    `Bilete 100 lei: ${standartTickets} bilete — ${standartTickets * 100} MDL`,
    `Bilete 150 lei: ${premieraTickets} bilete — ${premieraTickets * 150} MDL`,
    `Bilete 200 lei: ${specialTickets} bilete — ${specialTickets * 200} MDL`,
    `Total: ${totalTickets} bilete — ${totalAmount} MDL`,
  ];

  summaryLines.forEach((line, i) => {
    doc.text(line, 14, summaryStartY + 8 + i * 7);
  });

  doc.save(`raport_lunar_${selectedMonth}.pdf`);
};
