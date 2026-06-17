import type { Sale, ScheduleItem } from '../api/types';
import type { Workbook } from 'exceljs';

type GenerateSalesPeriodExcelParams = {
  sales: Sale[];
  schedules: ScheduleItem[];
  startDate: string;
  endDate: string;
};

type ReportRow = {
  schedule: ScheduleItem;
  price: number;
  bySaleDate: Record<string, { cash: number; card: number }>;
  totalCash: number;
  totalCard: number;
};

const getTicketPrice = (type: string): number => {
  if (type === 'Premiera') return 150;
  if (type === 'Special') return 200;
  return 100;
};

const formatDate = (value: string): string => value.split('-').reverse().join('.');

const formatSaleHeaderDate = (value: string): string => {
  const date = new Date(`${value}T00:00:00`);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date
    .toLocaleDateString('ro-RO', { month: 'short' })
    .replace('.', '');

  return `${day}.${month}`;
};

const formatDateForFile = (value: string): string => value.split('-').reverse().join('-');

const formatMonthYear = (value: string): string => {
  const date = new Date(`${value}T00:00:00`);
  const month = date.toLocaleDateString('ro-RO', { month: 'long' });
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
};

const getSaleDate = (createdAt: string): string => createdAt.slice(0, 10);

const normalizePaymentMethod = (method: string): 'cash' | 'card' =>
  method === 'card' ? 'card' : 'cash';

const getColumnLetter = (index: number): string => {
  let column = '';
  let value = index;

  while (value > 0) {
    const remainder = (value - 1) % 26;
    column = String.fromCharCode(65 + remainder) + column;
    value = Math.floor((value - 1) / 26);
  }

  return column;
};

const isOutsideReportMonth = (scheduleDate: string, startDate: string): boolean =>
  scheduleDate.slice(0, 7) !== startDate.slice(0, 7);

const buildReportRows = (sales: Sale[], schedules: ScheduleItem[]): ReportRow[] => {
  const scheduleMap = new Map(schedules.map((schedule) => [schedule.id, schedule]));
  const rows = new Map<string, ReportRow>();

  sales.forEach((sale) => {
    const schedule = scheduleMap.get(String(sale.schedule_id || '').trim());
    if (!schedule) return;

    const saleDate = getSaleDate(sale.created_at);
    const paymentMethod = normalizePaymentMethod(sale.payment_method);

    if (!rows.has(schedule.id)) {
      rows.set(schedule.id, {
        schedule,
        price: getTicketPrice(schedule.type || sale.type),
        bySaleDate: {},
        totalCash: 0,
        totalCard: 0,
      });
    }

    const row = rows.get(schedule.id);
    if (!row) return;

    row.bySaleDate[saleDate] ??= { cash: 0, card: 0 };
    row.bySaleDate[saleDate][paymentMethod] += Number(sale.total_sum || 0);

    if (paymentMethod === 'card') {
      row.totalCard += Number(sale.total_sum || 0);
    } else {
      row.totalCash += Number(sale.total_sum || 0);
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

export async function generateSalesPeriodExcel({
  sales,
  schedules,
  startDate,
  endDate,
}: GenerateSalesPeriodExcelParams) {
  const filteredSales = sales.filter((sale) => {
    const saleDate = getSaleDate(sale.created_at);
    return saleDate >= startDate && saleDate <= endDate;
  });

  const saleDates = Array.from(new Set(filteredSales.map((sale) => getSaleDate(sale.created_at)))).sort();
  const reportRows = buildReportRows(filteredSales, schedules);
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet1');
  const lastDateColumn = 4 + saleDates.length * 2;
  const totalCashColumn = lastDateColumn + 1;
  const totalCardColumn = lastDateColumn + 2;
  const totalColumn = lastDateColumn + 3;
  const lastColumnLetter = getColumnLetter(totalColumn);
  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8CCB4F' } } as const;
  const titleFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF17A9D8' } } as const;
  const priceFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } } as const;
  const thinBorder = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  } as const;

  worksheet.views = [{ showGridLines: true }];
  worksheet.mergeCells(2, 3, 2, Math.min(lastDateColumn, 20));
  worksheet.getCell(2, 3).value =
    `Raport pentru vânzări la casa de bilete pentru luna ${formatMonthYear(startDate)} ` +
    'La Teatrul Republican de Păpuși "Licurici"';
  worksheet.getCell(2, 3).font = { bold: true, size: 12 };

  worksheet.getColumn(1).width = 2;
  worksheet.getColumn(2).width = 4;
  worksheet.getColumn(3).width = 52;
  worksheet.getColumn(4).width = 7;

  worksheet.getCell(4, 4).value = 'Data';
  worksheet.getCell(4, 4).fill = headerFill;
  worksheet.getCell(5, 3).value = 'Denumirea Spectacolului';
  worksheet.getCell(5, 3).fill = titleFill;
  worksheet.getCell(6, 4).value = 'Preț';
  worksheet.getCell(6, 4).fill = priceFill;

  saleDates.forEach((saleDate, index) => {
    const startColumn = 5 + index * 2;
    const endColumn = startColumn + 1;

    worksheet.getColumn(startColumn).width = 10;
    worksheet.getColumn(endColumn).width = 10;
    worksheet.mergeCells(4, startColumn, 4, endColumn);
    worksheet.mergeCells(5, startColumn, 5, endColumn);
    worksheet.getCell(4, startColumn).value = formatSaleHeaderDate(saleDate);
    worksheet.getCell(5, startColumn).value = 'Vânzări total lei, inclusiv';
    worksheet.getCell(6, startColumn).value = 'Numerar';
    worksheet.getCell(6, endColumn).value = 'Card';
    worksheet.getCell(4, startColumn).fill = headerFill;
    worksheet.getCell(5, startColumn).fill = headerFill;
  });

  worksheet.getCell(5, totalCashColumn).value = 'Total Numerar';
  worksheet.getCell(5, totalCardColumn).value = 'Total Card';
  worksheet.getCell(5, totalColumn).value = 'Total';
  worksheet.getColumn(totalCashColumn).width = 14;
  worksheet.getColumn(totalCardColumn).width = 11;
  worksheet.getColumn(totalColumn).width = 12;

  reportRows.forEach((row, index) => {
    const rowNumber = 7 + index;
    const displayTime = row.schedule.time.split(':').slice(0, 2).join(':');

    if (isOutsideReportMonth(row.schedule.date, startDate)) {
      worksheet.getCell(rowNumber, 1).value = '!';
    }

    worksheet.getCell(rowNumber, 2).value = index + 1;
    worksheet.getCell(rowNumber, 3).value = `${row.schedule.title} ${formatDate(row.schedule.date)} ${displayTime}`;
    worksheet.getCell(rowNumber, 4).value = row.price;
    worksheet.getCell(rowNumber, 4).fill = priceFill;

    saleDates.forEach((saleDate, dateIndex) => {
      const cashColumn = 5 + dateIndex * 2;
      const cardColumn = cashColumn + 1;
      const value = row.bySaleDate[saleDate];

      if (value) {
        worksheet.getCell(rowNumber, cashColumn).value = value.cash;
        worksheet.getCell(rowNumber, cardColumn).value = value.card;
      }
    });

    worksheet.getCell(rowNumber, totalCashColumn).value = row.totalCash;
    worksheet.getCell(rowNumber, totalCardColumn).value = row.totalCard;
    worksheet.getCell(rowNumber, totalColumn).value = row.totalCash + row.totalCard;
  });

  const totalDailyRow = 7 + reportRows.length;
  const dailySummaryRow = totalDailyRow + 1;

  worksheet.mergeCells(totalDailyRow, 2, totalDailyRow, 3);
  worksheet.getCell(totalDailyRow, 2).value = 'Total zilnic';
  worksheet.getCell(totalDailyRow, 2).font = { bold: true, size: 13 };
  worksheet.getCell(totalDailyRow, 2).alignment = { horizontal: 'center' };

  saleDates.forEach((saleDate, index) => {
    const cashColumn = 5 + index * 2;
    const cardColumn = cashColumn + 1;
    const cashTotal = reportRows.reduce((sum, row) => sum + (row.bySaleDate[saleDate]?.cash ?? 0), 0);
    const cardTotal = reportRows.reduce((sum, row) => sum + (row.bySaleDate[saleDate]?.card ?? 0), 0);

    worksheet.getCell(totalDailyRow, cashColumn).value = cashTotal;
    worksheet.getCell(totalDailyRow, cardColumn).value = cardTotal;
    worksheet.mergeCells(dailySummaryRow, cashColumn, dailySummaryRow, cardColumn);
    worksheet.getCell(dailySummaryRow, cashColumn).value = cashTotal + cardTotal;
  });

  const totalCash = reportRows.reduce((sum, row) => sum + row.totalCash, 0);
  const totalCard = reportRows.reduce((sum, row) => sum + row.totalCard, 0);
  worksheet.getCell(totalDailyRow, totalCashColumn).value = totalCash;
  worksheet.getCell(totalDailyRow, totalCardColumn).value = totalCard;
  worksheet.getCell(totalDailyRow, totalColumn).value = totalCash + totalCard;

  for (let row = 4; row <= dailySummaryRow; row += 1) {
    for (let column = 1; column <= totalColumn; column += 1) {
      const cell = worksheet.getCell(row, column);
      cell.border = thinBorder;
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      if (column === 3 && row >= 7 && row < totalDailyRow) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
      if (row === totalDailyRow || column >= totalCashColumn) {
        cell.font = { bold: true };
      }
    }
  }

  worksheet.getRow(2).height = 22;
  worksheet.getRow(4).height = 18;
  worksheet.getRow(5).height = 20;
  worksheet.getRow(6).height = 18;
  worksheet.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
  };
  worksheet.pageSetup.printArea = `A1:${lastColumnLetter}${dailySummaryRow + 4}`;

  const fileName = `Raport ${formatDateForFile(startDate)} - ${formatDateForFile(endDate)}.xlsx`;
  await downloadWorkbook(workbook, fileName);
}
