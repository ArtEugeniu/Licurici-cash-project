import path from 'path';
import pdfToPrinter from 'pdf-to-printer';
import fs from 'fs';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import * as fontkit from 'fontkit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const { print } = pdfToPrinter;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PRINTER_NAME = 'Honeywell PC42t (203 dpi) - DP';
const PRINT_TIMEOUT_MS = 20000;

function createPrintError(message) {
  const error = new Error(message);
  error.statusCode = 500;
  return error;
}

async function withTimeout(promise, timeoutMs, timeoutMessage) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(createPrintError(timeoutMessage)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timeoutId);
  }
}

function validatePrintData(data) {
  const quantity = Number(data.quantity);

  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw createPrintError('Numarul de bilete pentru tiparire nu este valid');
  }

  if (!data.title || !data.date || !data.time || !data.price) {
    throw createPrintError('Datele pentru tiparirea biletului sunt incomplete');
  }

  return quantity;
}

function wrapText(text, font, fontSize, maxWidth) {
  const words = String(text).split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = font.widthOfTextAtSize(`${currentLine} ${word}`, fontSize);

    if (width < maxWidth) {
      currentLine += ` ${word}`;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
}

export async function printTicket(data) {
  const quantity = validatePrintData(data);
  const fontBytes = fs.readFileSync(path.join(__dirname, 'fonts', 'Roboto_Condensed-Medium.ttf'));

  for (let i = 0; i < quantity; i++) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([156, 241]);
    const font = await pdfDoc.embedFont(fontBytes);
    const fontSize = 12;
    const maxTextWidth = 85;
    const titleLines = wrapText(data.title, font, fontSize, maxTextWidth);
    const startX = 123;
    const lineSpacing = fontSize + 2;
    const filePath = path.join(__dirname, `ticket_${i + 1}.pdf`);

    titleLines.forEach((line, index) => {
      page.drawText(line, {
        x: startX - index * lineSpacing,
        y: 178,
        rotate: degrees(-90),
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    });

    page.drawText(data.date, {
      x: 45,
      y: 208,
      rotate: degrees(-90),
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(data.time, {
      x: 30,
      y: 208,
      rotate: degrees(-90),
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`${data.price} Lei`, {
      x: 15,
      y: 208,
      rotate: degrees(-90),
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    try {
      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(filePath, pdfBytes);

      await withTimeout(
        print(filePath, { printer: PRINTER_NAME }),
        PRINT_TIMEOUT_MS,
        `Tiparirea biletului ${i + 1} din ${quantity} a depasit ${PRINT_TIMEOUT_MS / 1000} secunde`
      );

      console.log(`Bilet ${i + 1} din ${quantity} trimis la tiparire`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw createPrintError(`Eroare la tiparirea biletului ${i + 1} din ${quantity}: ${message}`);
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  console.log('Toate biletele au fost trimise la tiparire');
}
