#!/usr/bin/env node
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import generateTicketsPeriodReport from '../services/reportsService.js';

async function run() {
  const db = await open({ filename: ':memory:', driver: sqlite3.Database });

  // Create minimal schema matching production expectations
  await db.exec(`
    CREATE TABLE tickets_in (
      id TEXT PRIMARY KEY,
      number_from TEXT,
      number_to TEXT,
      total_tickets INTEGER,
      created_at TEXT
    );

    CREATE TABLE sales (
      id TEXT PRIMARY KEY,
      quantity INTEGER,
      total_sum INTEGER,
      payment_method TEXT,
      type TEXT,
      created_at TEXT
    );
  `);

  // Insert sample data: two days
  await db.run(`INSERT INTO tickets_in (id, number_from, number_to, total_tickets, created_at) VALUES
    ('t1','0001','0100',100,'2025-09-21 10:00:00'),
    ('t2','0101','0200',100,'2025-09-27 11:00:00')
  `);

  // Sales: on 2025-09-21 sell 91 tickets (59 cash 32 card at 100), amount 9100
  await db.run(`INSERT INTO sales (id, quantity, total_sum, payment_method, type, created_at) VALUES
    ('s1',59,5900,'cash','Standart','2025-09-21 12:00:00'),
    ('s2',32,3200,'card','Standart','2025-09-21 12:05:00'),
    ('s3',37,3700,'cash','Standart','2025-09-27 13:00:00')
  `);

  const report = await generateTicketsPeriodReport(db, '2025-09-01', '2025-09-30');

  // Basic assertions
  const expectReceived = 200; // 100 + 100
  const expectSoldTotal = 128; // 91 + 37
  const expectAmount = 5900 + 3200 + 3700; // 12800

  if (report.totals.received_total !== expectReceived) {
    console.error('FAIL: received_total', report.totals.received_total, 'expected', expectReceived);
    process.exit(2);
  }

  if (report.totals.sold_total !== expectSoldTotal) {
    console.error('FAIL: sold_total', report.totals.sold_total, 'expected', expectSoldTotal);
    process.exit(2);
  }

  if (report.totals.amount_total !== expectAmount) {
    console.error('FAIL: amount_total', report.totals.amount_total, 'expected', expectAmount);
    process.exit(2);
  }

  console.log('UNIT TEST PASS');
  process.exit(0);
}

run().catch(err => {
  console.error('UNIT TEST ERROR', err);
  process.exit(2);
});
