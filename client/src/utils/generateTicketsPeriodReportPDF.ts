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
    amount_cash?: number;
    amount_card?: number;
    remaining_on_box: number;
  };
  generated_at: string;
  meta?: {
    beginning_inventory?: number;
    sold_from_prev?: number;
    sold_from_new?: number;
  };
  sales_by_month?: { month: string; count: number }[];
};

export const generateTicketsPeriodReportPDF = (data: TicketsPeriodReportData) => {
  const { startDate, endDate, dailyRows, totals, meta } = data as any;
  const fmtDate = (s?: string) => {
    if (!s) return '';
    const parts = String(s).split('-');
    if (parts.length >= 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
    return s;
  };
    // Create PDF in landscape orientation
  const doc = new jsPDF({ format: 'a4', orientation: 'landscape' });

  doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegularBase64);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', RobotoBoldBase64);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto');

  doc.setFontSize(13);  
    doc.text(  
      `Raport pe Bilete Teatrul Republican de Papusi "Licurici" pentru perioada - ${fmtDate(startDate)} - ${fmtDate(endDate)}`,  
      14,  
      15  
    );  

  // First table: beginning inventory + individual ticket receipts (with serials) + total at box in period
  const firstTableRows: string[][] = [];
  if (meta && (meta.beginning_inventory || meta.beginning_inventory === 0)) {
    // Romanian: "Stoc inițial" (остаток на начало периода)
    firstTableRows.push([ 'Stoc inițial', '', '', String(meta.beginning_inventory) ]);
  }

  for (const r of dailyRows) {
    // r.date expected as YYYY-MM-DD; r.number_from/number_to may be strings
    const d = r.date ? r.date.split('-').reverse().join('-') : '';
    firstTableRows.push([ d, String(r.number_from || ''), String(r.number_to || ''), String(r.tickets_received) ]);
  }

  // Add total tickets available at box-office during period row
  // Romanian: "Total la casă în perioadă" = beginning_inventory + received_total
  const beginning = (meta && meta.beginning_inventory) ? Number(meta.beginning_inventory) : 0;
  const totalAtBox = beginning + (totals.received_total || 0);
  firstTableRows.push([ 'Total la casă în perioadă', '', '', String(totalAtBox) ]);

  autoTable(doc, {
    head: [[ 'Data', 'Seria de la', 'Seria pana la', 'Bilete' ]],
    body: firstTableRows,
    styles: { font: 'Roboto', fontSize: 9 },
    startY: 20,
  });

  const secondStartY = (doc as any).lastAutoTable.finalY + 4;
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
    styles: { font: 'Roboto', fontSize: 9 },
    startY: secondStartY,
  });

  const summaryStartY2 = (doc as any).lastAutoTable.finalY + 4;
  // Make all summary text under the tables the same size to avoid overlap
  // Increase font for summary by 2 points as requested
  const summaryFontSize = 11;
  doc.setFontSize(summaryFontSize);
  const summaryLines = [
    `Total primite: ${totals.received_total} bilete`,
  ];

  // Append monthly breakdown next to total sold if server returned sales_by_month
  const salesByMonth: { month: string; count: number }[] = (data as any).sales_by_month || [];
  let soldLine = `Total bilete vândute: ${totals.sold_total} bilete`;
  if (salesByMonth && salesByMonth.length) {
    const parts = salesByMonth.map(s => `${s.month}: ${s.count}`);
    soldLine += ` (${parts.join(', ')})`;
  }
  summaryLines.push(soldLine);
  
  // push remaining summary lines
  // show breakdown by payment method if available
  if (typeof totals.amount_cash !== 'undefined' || typeof totals.amount_card !== 'undefined') {
    const cash = totals.amount_cash || 0;
    const card = totals.amount_card || 0;
    // prepare per-month amount breakdown provided by server
    const salesAmountByMonth: { month: string; cash: number; card: number }[] = (data as any).sales_amount_by_month || [];

    // build cash line with optional per-month parentheses
    let cashLine = `Suma (numerar): ${cash} MDL`;
    const cashParts = (salesAmountByMonth || []).filter(m => m.cash && m.cash > 0).map(m => `${m.month}: ${m.cash} MDL`);
    if (cashParts.length) cashLine += ` (${cashParts.join(', ')})`;
    summaryLines.push(cashLine);

    // build card line with optional per-month parentheses
    let cardLine = `Suma (card): ${card} MDL`;
    const cardParts = (salesAmountByMonth || []).filter(m => m.card && m.card > 0).map(m => `${m.month}: ${m.card} MDL`);
    if (cardParts.length) cardLine += ` (${cardParts.join(', ')})`;
    summaryLines.push(cardLine);
  }
  summaryLines.push(`Suma totală: ${totals.amount_total} MDL`);
  summaryLines.push(`Rămase la casă: ${totals.remaining_on_box} bilete`);
  // Remaining serials (current state) and signature placement - prepare page metrics and signer
  const remaining = (data as any).remaining_serials || [];
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const signer = 'Specialist Principal Tehnologii Informationale Artemiev Eugeniu';
  const fmtDateTime = (iso?: string) => {
    const d = iso ? new Date(iso) : new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };
  const genDate = fmtDateTime((data as any).generated_at || new Date().toISOString());

  // compute available vertical space for summary + remaining line (leave 12pt above signature)
  const bottomY = pageHeight - margin;
  const minRemainingY = bottomY - 12 - summaryFontSize;
  const linesCount = summaryLines.length + 1; // include remaining series line
  const defaultLineHeight = 7;
  const availableSpace = minRemainingY - summaryStartY2;
  let summaryLineHeight = defaultLineHeight;
  if (availableSpace > 0 && availableSpace < defaultLineHeight * linesCount) {
    // compress line height to fit equally, but not too small
    const newLH = Math.floor(availableSpace / linesCount);
    summaryLineHeight = newLH >= 4 ? newLH : 4;
  }

  // draw summary lines with uniform spacing
  summaryLines.forEach((line, i) => {
    doc.text(line, 14, summaryStartY2 + i * summaryLineHeight);
  });

  // Build left text including label
  let leftText = '';
  if (remaining.length === 0) leftText = 'Serii rămase la casă (actual): Nicio serie rămasă.';
  else {
    const parts: string[] = [];
    for (const r of remaining) parts.push(r.from === r.to ? `${r.from}` : `${r.from}-${r.to}`);
    leftText = 'Serii rămase la casă (actual): ' + parts.join(', ');
  }

  // Reserve space for signature on the right
  doc.setFontSize(9);
  const signerWidth = doc.getTextWidth(signer) + 6; // small gap
  const availableLeftWidth = pageWidth - margin * 2 - signerWidth - 10;

  // Truncate leftText to fit availableLeftWidth
  let leftTextShort = leftText;
  while (doc.getTextWidth(leftTextShort) > availableLeftWidth && leftTextShort.length > 4) {
    leftTextShort = leftTextShort.slice(0, -4) + '...';
  }

  // place remaining series either right under the summary or just above the signature area (leave 12pt gap)

  // Draw leftTextShort left-aligned at remainingY using the same summary font
  doc.setFontSize(summaryFontSize);
  // compute remainingY right after the last summary line
  let remainingYCalculated = summaryStartY2 + summaryLines.length * summaryLineHeight;
  // ensure remaining doesn't overlap signature area (leave 12pt above signature)
  if (remainingYCalculated > minRemainingY) remainingYCalculated = minRemainingY;
  doc.text(leftTextShort, margin, remainingYCalculated);

  // Draw signer right-aligned fixed at bottomY, and date below it
  doc.setFontSize(8);
  const signerWidthActual = doc.getTextWidth(signer);
  const signerX = pageWidth - margin - signerWidthActual;
  const signerY = bottomY;
  doc.text(signer, signerX, signerY);
  const dateWidth = doc.getTextWidth(genDate);
  const dateX = pageWidth - margin - dateWidth;
  const dateY = signerY + 6;
  doc.text(genDate, dateX, dateY);

  doc.save(`raport_bilete_${fmtDate(startDate)}_to_${fmtDate(endDate)}.pdf`);
};

export default generateTicketsPeriodReportPDF;
