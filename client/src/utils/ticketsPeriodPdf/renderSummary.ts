import type jsPDF from 'jspdf';
import { buildRemainingSerialsText, buildSummaryLines } from './buildRows';
import { formatReportDateTime, truncateTextToWidth } from './formatters';
import type { TicketsPeriodReportData } from './types';

export const renderSummary = (doc: jsPDF, data: TicketsPeriodReportData, startY: number) => {
  const summaryFontSize = 11;
  const summaryLines = buildSummaryLines(data);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const signer = 'Specialist Principal Tehnologii Informationale Artemiev Eugeniu';
  const generatedDate = formatReportDateTime(data.generated_at || new Date().toISOString());
  const bottomY = pageHeight - margin;
  const minRemainingY = bottomY - 12 - summaryFontSize;
  const linesCount = summaryLines.length + 1;
  const defaultLineHeight = 7;
  const availableSpace = minRemainingY - startY;
  let summaryLineHeight = defaultLineHeight;

  if (availableSpace > 0 && availableSpace < defaultLineHeight * linesCount) {
    const compressedLineHeight = Math.floor(availableSpace / linesCount);
    summaryLineHeight = compressedLineHeight >= 4 ? compressedLineHeight : 4;
  }

  doc.setFontSize(summaryFontSize);
  summaryLines.forEach((line, index) => {
    doc.text(line, margin, startY + index * summaryLineHeight);
  });

  doc.setFontSize(9);
  const signerWidth = doc.getTextWidth(signer) + 6;
  const availableLeftWidth = pageWidth - margin * 2 - signerWidth - 10;
  const remainingText = truncateTextToWidth(doc, buildRemainingSerialsText(data), availableLeftWidth);

  doc.setFontSize(summaryFontSize);
  let remainingY = startY + summaryLines.length * summaryLineHeight;
  if (remainingY > minRemainingY) remainingY = minRemainingY;
  doc.text(remainingText, margin, remainingY);

  doc.setFontSize(8);
  const signerWidthActual = doc.getTextWidth(signer);
  const signerX = pageWidth - margin - signerWidthActual;
  const signerY = bottomY;
  doc.text(signer, signerX, signerY);

  const dateWidth = doc.getTextWidth(generatedDate);
  const dateX = pageWidth - margin - dateWidth;
  const dateY = signerY + 6;
  doc.text(generatedDate, dateX, dateY);
};
