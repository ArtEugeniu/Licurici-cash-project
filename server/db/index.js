import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export let db;

export async function initDB() {
  db = await open({
    filename: './db/tickets.db',
    driver: sqlite3.Database
  });
}