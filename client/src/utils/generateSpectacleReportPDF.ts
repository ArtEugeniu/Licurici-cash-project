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
  schedule: {
    date?: string;
    title: string;
  };
};

export type SpectacleReportData = {
  selectedDate: string;
  spectacleTitle: string;
  filteredSales: Sale[];
  totalCashTickets: number;
  totalCardTickets: number;
  totalCashSum: number;
  totalCardSum: number;
  totalSum: number;
};

export const generateSpectacleReportPDF = (data: SpectacleReportData) => {
  const {
    selectedDate,
    spectacleTitle,
    filteredSales,
    totalCashTickets,
    totalCardTickets,
    totalCashSum,
    totalCardSum,
    totalSum,
  } = data;

  const doc = new jsPDF();

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.setFont('Roboto');


  doc.setFontSize(16);
  doc.text(`Raport pentru spectacol — ${spectacleTitle}`, 14, 15);
  doc.text(`Data: ${selectedDate}`, 14, 23);

  const tableRows = filteredSales.map(sale => [
    sale.type,
    sale.quantity.toString(),
    `${sale.total_sum} MDL`,
    sale.payment_method === 'cash' ? 'Numerar' : 'Card',
  ]);

  autoTable(doc, {
    head: [['Tip bilet', 'Cantitate', 'Suma', 'Metodă plată']],
    styles: { font: 'Roboto' },
    body: tableRows,
    startY: 30,
  });

  const summaryStartY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(12);
  doc.text('Sumar:', 14, summaryStartY);

  const summaryLines = [
    `Bilete numerar: ${totalCashTickets}`,
    `Bilete card: ${totalCardTickets}`,
    `Suma bilete numerar: ${totalCashSum} MDL`,
    `Suma bilete card: ${totalCardSum} MDL`,
    `Suma totală: ${totalSum} MDL`,
  ];

  summaryLines.forEach((line, i) => {
    doc.text(line, 14, summaryStartY + 8 + i * 7);
  });

  doc.save(`raport_spectacol_${spectacleTitle.replace(/\s+/g, '_').toLowerCase()}_${selectedDate}.pdf`);
};
