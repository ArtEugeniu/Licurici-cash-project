import type jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const renderInventoryTable = (doc: jsPDF, rows: string[][], startY: number) => {
  autoTable(doc, {
    head: [['Data', 'Seria de la', 'Seria până la', 'Bilete']],
    body: rows,
    styles: { font: 'Roboto', fontSize: 9 },
    startY,
  });

  return (doc as any).lastAutoTable.finalY;
};

export const renderSalesTable = (doc: jsPDF, rows: string[][], startY: number) => {
  autoTable(doc, {
    head: [['Tip / Metodă', 'Bilete', 'Suma']],
    body: rows,
    styles: { font: 'Roboto', fontSize: 9 },
    startY,
  });

  return (doc as any).lastAutoTable.finalY;
};
