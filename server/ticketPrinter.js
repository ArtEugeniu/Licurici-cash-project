import path from 'path';
import pdfToPrinter from 'pdf-to-printer';
const { print } = pdfToPrinter;
import fs from 'fs';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import * as fontkit from 'fontkit';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function printTicket(data) {
  const fontBytes = fs.readFileSync(path.join(__dirname, 'fonts', 'Roboto_Condensed-Medium.ttf'));

  // Функция для переноса текста по ширине
  function wrapText(text, font, fontSize, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  for (let i = 0; i < data.quantity; i++) {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([156, 241]);

    const font = await pdfDoc.embedFont(fontBytes);
    const fontSize = 12;

    // ====== Название спектакля с переносом ======
    const maxTextWidth = 85; // ширина без зоны КОНТРОЛЬ (2.5 см)
    const titleLines = wrapText(data.title, font, fontSize, maxTextWidth);

    let startX = 123; 
    const lineSpacing = fontSize + 2;

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

    // ====== Остальная информация на билете ======
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

    // ====== Сохранение и печать ======
    const pdfBytes = await pdfDoc.save();
    const filePath = path.join(__dirname, `ticket_${i + 1}.pdf`);
    fs.writeFileSync(filePath, pdfBytes);

    const options = {
      printer: 'Honeywell PC42t (203 dpi) - DP',
    };

    await print(filePath, options);
    console.log(`Билет ${i + 1} из ${data.quantity} отправлен на печать`);

    fs.unlinkSync(filePath);
  }

  console.log('Все билеты успешно напечатаны');
}
