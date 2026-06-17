import type jsPDF from 'jspdf';

export const formatReportDate = (value?: string) => {
  if (!value) return '';

  const parts = String(value).split('-');
  if (parts.length >= 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;

  return value;
};

export const formatReportDateTime = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();

  return `${dd}.${mm}.${yyyy}`;
};

export const truncateTextToWidth = (doc: jsPDF, text: string, maxWidth: number) => {
  let shortened = text;

  while (doc.getTextWidth(shortened) > maxWidth && shortened.length > 4) {
    shortened = shortened.slice(0, -4) + '...';
  }

  return shortened;
};
