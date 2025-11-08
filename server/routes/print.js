import express from 'express';
import { printTicket } from '../ticketPrinter.js'; 

export const routerPrint = express.Router();

routerPrint.use(express.json());  

routerPrint.post('/', async (req, res) => {
  try {
    const ticketData = req.body;

    console.log('Данные для печати:', ticketData);

    await printTicket(ticketData);

    res.json({ status: 'ok', message: 'Билет отправлен на печать' });
  } catch (err) {
    console.error('Ошибка при печати:', err);
    res.status(500).json({ status: 'error', message: 'Ошибка печати' });
  }
});
