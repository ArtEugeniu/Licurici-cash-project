import express from 'express';
import { printTicketDPL } from '../printer/printer.js';

export const routerPrint = express.Router();

routerPrint.get("/", async (req, res) => {
  try {
    console.log("Данные для печати:", req.body);

    res.json({ status: "ok", message: "Server print work" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Server print Error" });
  }
});

routerPrint.post("/", async (req, res) => {
  try {
    const ticketData = req.body;

    await printTicketDPL(ticketData);

    res.json({ status: "ok", message: "Bilet transmis la imprimare" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", message: "Eraore la imprimare" });
  }
});