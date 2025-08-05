import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { RobotoRegularBase64 } from '../fonts/Roboto-Regular-normal';
import { RobotoBoldBase64 } from '../fonts/Roboto-Regular-bold';

export type PeriodReportData = {
  startDate: string;
  endDate: string;
  totalCashTickets: number;
  totalCashAmount: number;
  totalCardTickets: number;
  totalCardAmount: number;
  totalTickets: number;
  totalAmount: number;
};

export const generatePeriodReportPDF = (data: PeriodReportData) => {
  const {
    startDate,
    endDate,
    totalCashTickets,
    totalCashAmount,
    totalCardTickets,
    totalCardAmount,
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
  doc.text(`Raport vânzări — ${startDate} până la ${endDate}`, 14, 15);

  autoTable(doc, {
    head: [['Tip plata', 'Nr. bilete', 'Suma']],
    styles: { font: 'Roboto' },
    body: [
      ['Numerar', totalCashTickets.toString(), `${totalCashAmount} MDL`],
      ['Card', totalCardTickets.toString(), `${totalCardAmount} MDL`],
      [{ content: 'Total', styles: { fontStyle: 'bold' } }, totalTickets.toString(), `${totalAmount} MDL`],
    ],
    startY: 25,
  });

  doc.save(`raport_perioada_${startDate}_to_${endDate}.pdf`);
};
