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

export type SpectacleReportData = {
  selectedDate: string;
  dateTo: string;
  spectacleTitle: string;
  filteredSales: Sale[];
  totalCashTickets: number;
  totalCardTickets: number;
  totalCashSum: number;
  totalCardSum: number;
  totalSum: number;

    groupedData: {
      date: string;
      time?: string;
      title: string;
      card_method: number;
      card_sum: number;
      cash_method: number;
      cash_sum: number;
      total_tickets: number;
      total_sum: number;
  }[];
};

export const generateSpectacleReportPDF = (data: SpectacleReportData) => {
  const {
    selectedDate,
    dateTo,
    spectacleTitle,
    totalCashTickets,
    totalCardTickets,
    totalCashSum,
    totalCardSum,
    totalSum,
    groupedData,
  } = data;

  const doc = new jsPDF();

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

  doc.setFont('Roboto');
  doc.setFontSize(16);
  doc.text(`Raport pentru spectacole`, 14, 15);
  doc.text(`Perioada: ${selectedDate.split('-').reverse().join('.')} - ${dateTo.split('-').reverse().join('.')}`, 14, 23);

  // Подготовка данных для таблицы из groupedData
  const tableRows = groupedData.map(item => [
    `${item.date.split('-').reverse().join('-')} ${item.time ? item.time.split(':').slice(0,2).join(':') : ''}`,
    item.title,
    item.cash_method.toString(),
    `${item.cash_sum} MDL`,
    item.card_method.toString(),
    `${item.card_sum} MDL`,
    item.total_tickets.toString(),
    `${item.total_sum} MDL`
  ]);

  autoTable(doc, {
    head: [[
      'Data',
      'Spectacol',
      'Nr. bilete numerar',
      'Suma bilete numerar',
      'Nr. bilete card',
      'Suma bilete card',
      'Nr. total bilete',
      'Suma totala'
    ]],
    body: tableRows,
    styles: { font: 'Roboto', fontSize: 10 },
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

  doc.save(`raport_spectacole_${selectedDate.split('-').reverse().join('.')}-${dateTo.split('-').reverse().join('.')}.pdf`);
};
