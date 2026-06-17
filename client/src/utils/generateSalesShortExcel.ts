import type { Sale, ScheduleItem } from '../api/types';
import type { Workbook } from 'exceljs';

type GenerateSalesShortExcelParams = {
  sales: Sale[];
  schedules: ScheduleItem[];
  startDate: string;
  endDate: string;
};

type ReportRow = {
  schedule: ScheduleItem;
  price: number;
  cashAmount: number;
  cashTickets: number;
  cardAmount: number;
  cardTickets: number;
};

const getTicketPrice = (type: string): number => {
  if (type === 'Premiera') return 150;
  if (type === 'Special') return 200;
  return 100;
};

const getSaleDate = (createdAt: string): string => createdAt.slice(0, 10);

const formatDate = (value: string): string => value.split('-').reverse().join('.');

const formatDateForFile = (value: string): string => value.split('-').reverse().join('-');

const formatMonthYear = (value: string): string => {
  const date = new Date(`${value}T00:00:00`);
  const month = date.toLocaleDateString('ro-RO', { month: 'long' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
};

const formatAmountWithTickets = (amount: number, tickets: number): string =>
  amount > 0 || tickets > 0 ? `${amount} (${tickets})` : '0';

const normalizePaymentMethod = (method: string): 'cash' | 'card' =>
  method === 'card' ? 'card' : 'cash';

const isOutsideReportMonth = (scheduleDate: string, startDate: string): boolean =>
  scheduleDate.slice(0, 7) !== startDate.slice(0, 7);

const buildReportRows = (sales: Sale[], schedules: ScheduleItem[]): ReportRow[] => {
  const scheduleMap = new Map(schedules.map((schedule) => [schedule.id, schedule]));
  const rows = new Map<string, ReportRow>();

  sales.forEach((sale) => {
    const schedule = scheduleMap.get(String(sale.schedule_id || '').trim());
    if (!schedule) return;

    if (!rows.has(schedule.id)) {
      rows.set(schedule.id, {
        schedule,
        price: getTicketPrice(schedule.type || sale.type),
        cashAmount: 0,
        cashTickets: 0,
        cardAmount: 0,
        cardTickets: 0,
      });
    }

    const row = rows.get(schedule.id);
    if (!row) return;

    const amount = Number(sale.total_sum || 0);
    const tickets = Number(sale.quantity || 0);

    if (normalizePaymentMethod(sale.payment_method) === 'card') {
      row.cardAmount += amount;
      row.cardTickets += tickets;
    } else {
      row.cashAmount += amount;
      row.cashTickets += tickets;
    }
  });

  return [...rows.values()].sort((a, b) => {
    if (a.schedule.date !== b.schedule.date) return a.schedule.date.localeCompare(b.schedule.date);
    if (a.schedule.time !== b.schedule.time) return a.schedule.time.localeCompare(b.schedule.time);
    return a.schedule.title.localeCompare(b.schedule.title, 'ro');
  });
};

const downloadWorkbook = async (workbook: Workbook, fileName: string) => {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

export async function generateSalesShortExcel({
  sales,
  schedules,
  startDate,
  endDate,
}: GenerateSalesShortExcelParams) {
  const filteredSales = sales.filter((sale) => {
    const saleDate = getSaleDate(sale.created_at);
    return saleDate >= startDate && saleDate <= endDate;
  });
  const reportRows = buildReportRows(filteredSales, schedules);
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  const blueFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17A9D8' } } as const;
  const priceFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } } as const;
  const thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  } as const;
  const mediumBorder = {
    top: { style: 'medium' },
    left: { style: 'medium' },
    bottom: { style: 'medium' },
    right: { style: 'medium' },
  } as const;

  worksheet.views = [{ showGridLines: true }];
  worksheet.mergeCells(2, 3, 2, 7);
  worksheet.getCell(2, 3).value =
    `Raport pentru vânzări la casa de bilete pentru luna ${formatMonthYear(startDate)} ` +
    'La Teatrul Republican de Păpuși "Licurici"';
  worksheet.getCell(2, 3).font = { bold: true, size: 12 };

  worksheet.getColumn(1).width = 2;
  worksheet.getColumn(2).width = 4;
  worksheet.getColumn(3).width = 52;
  worksheet.getColumn(4).width = 7;
  worksheet.getColumn(5).width = 17;
  worksheet.getColumn(6).width = 14;
  worksheet.getColumn(7).width = 17;

  worksheet.mergeCells(5, 2, 6, 2);
  worksheet.mergeCells(5, 3, 6, 3);
  worksheet.mergeCells(5, 4, 6, 4);
  worksheet.mergeCells(5, 5, 6, 5);
  worksheet.mergeCells(5, 6, 6, 6);
  worksheet.mergeCells(5, 7, 6, 7);

  worksheet.getCell(5, 3).value = 'Denumirea Spectacolului';
  worksheet.getCell(5, 3).fill = blueFill;
  worksheet.getCell(5, 4).value = 'Preț';
  worksheet.getCell(5, 4).fill = priceFill;
  worksheet.getCell(5, 5).value = 'Numerar';
  worksheet.getCell(5, 6).value = 'Card';
  worksheet.getCell(5, 7).value = 'Total';

  reportRows.forEach((row, index) => {
    const rowNumber = 7 + index;
    const displayTime = row.schedule.time.split(':').slice(0, 2).join(':');
    const totalAmount = row.cashAmount + row.cardAmount;
    const totalTickets = row.cashTickets + row.cardTickets;

    if (isOutsideReportMonth(row.schedule.date, startDate)) {
      worksheet.getCell(rowNumber, 1).value = '!';
    }

    worksheet.getCell(rowNumber, 2).value = index + 1;
    worksheet.getCell(rowNumber, 3).value = `${row.schedule.title} ${formatDate(row.schedule.date)} ${displayTime}`;
    worksheet.getCell(rowNumber, 4).value = row.price;
    worksheet.getCell(rowNumber, 4).fill = priceFill;
    worksheet.getCell(rowNumber, 5).value = formatAmountWithTickets(row.cashAmount, row.cashTickets);
    worksheet.getCell(rowNumber, 6).value = formatAmountWithTickets(row.cardAmount, row.cardTickets);
    worksheet.getCell(rowNumber, 7).value = formatAmountWithTickets(totalAmount, totalTickets);
  });

  const totalRow = 7 + reportRows.length;
  const totalCashAmount = reportRows.reduce((sum, row) => sum + row.cashAmount, 0);
  const totalCashTickets = reportRows.reduce((sum, row) => sum + row.cashTickets, 0);
  const totalCardAmount = reportRows.reduce((sum, row) => sum + row.cardAmount, 0);
  const totalCardTickets = reportRows.reduce((sum, row) => sum + row.cardTickets, 0);
  const totalAmount = totalCashAmount + totalCardAmount;
  const totalTickets = totalCashTickets + totalCardTickets;

  worksheet.mergeCells(totalRow, 2, totalRow + 1, 3);
  worksheet.mergeCells(totalRow, 4, totalRow + 1, 4);
  worksheet.mergeCells(totalRow, 5, totalRow + 1, 5);
  worksheet.mergeCells(totalRow, 6, totalRow + 1, 6);
  worksheet.mergeCells(totalRow, 7, totalRow + 1, 7);
  worksheet.getCell(totalRow, 2).value = 'Total';
  worksheet.getCell(totalRow, 2).font = { bold: true, size: 18 };
  worksheet.getCell(totalRow, 4).fill = priceFill;
  worksheet.getCell(totalRow, 5).value = formatAmountWithTickets(totalCashAmount, totalCashTickets);
  worksheet.getCell(totalRow, 6).value = formatAmountWithTickets(totalCardAmount, totalCardTickets);
  worksheet.getCell(totalRow, 7).value = formatAmountWithTickets(totalAmount, totalTickets);

  for (let row = 5; row <= totalRow + 1; row += 1) {
    for (let column = 1; column <= 7; column += 1) {
      const cell = worksheet.getCell(row, column);
      cell.border = row >= totalRow || column >= 2 ? mediumBorder : thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      if (column === 3 && row >= 7 && row < totalRow) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      if (row === 5 || row === 6 || row >= totalRow) {
        cell.font = { ...(cell.font || {}), bold: true };
      }
    }
  }

  worksheet.getRow(2).height = 22;
  worksheet.getRow(5).height = 22;
  worksheet.getRow(totalRow).height = 24;
  worksheet.getRow(totalRow + 1).height = 24;

  const signatureRow = totalRow + 4;
  worksheet.getCell(signatureRow, 3).value = 'Specialist Principal Tehnologii Informaționale';
  worksheet.getCell(signatureRow + 1, 3).value = 'Artemiev Eugeniu';
  worksheet.getCell(signatureRow + 4, 3).value = formatDate(endDate);

  worksheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };
  worksheet.pageSetup.printArea = `A1:G${signatureRow + 4}`;

  const fileName = `Raport scurt ${formatDateForFile(startDate)} - ${formatDateForFile(endDate)}.xlsx`;
  await downloadWorkbook(workbook, fileName);
}
