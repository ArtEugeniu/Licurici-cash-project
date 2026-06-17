import jsPDF from 'jspdf';
import { RobotoRegularBase64 } from '../fonts/Roboto-Regular-normal';
import { RobotoBoldBase64 } from '../fonts/Roboto-Regular-bold';
import { buildInventoryRows, buildSalesRows } from './ticketsPeriodPdf/buildRows';
import { formatReportDate } from './ticketsPeriodPdf/formatters';
import { renderSummary } from './ticketsPeriodPdf/renderSummary';
import { renderInventoryTable, renderSalesTable } from './ticketsPeriodPdf/renderTables';
import type { TicketsPeriodReportData } from './ticketsPeriodPdf/types';

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

const setupRobotoFont = (doc: jsPDF) => {
  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto');
};

export const generateTicketsPeriodReportPDF = (data: TicketsPeriodReportData) => {
  const { startDate, endDate } = data;
  const doc = new jsPDF({ format: 'a4', orientation: 'landscape' });

  setupRobotoFont(doc);

  doc.setFontSize(13);
  doc.text(
    `Raport pe Bilete Teatrul Republican de Păpuși "Licurici" pentru perioada - ${formatReportDate(startDate)} - ${formatReportDate(endDate)}`,
    14,
    15
  );

  const inventoryTableEndY = renderInventoryTable(doc, buildInventoryRows(data), 20);
  const salesTableEndY = renderSalesTable(doc, buildSalesRows(data), inventoryTableEndY + 4);
  renderSummary(doc, data, salesTableEndY + 4);

  doc.save(`raport_bilete_${formatReportDate(startDate)}_to_${formatReportDate(endDate)}.pdf`);
};

export default generateTicketsPeriodReportPDF;
