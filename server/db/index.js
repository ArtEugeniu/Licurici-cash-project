import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export let db;

export async function initDB() {
  db = await open({
    // Use an absolute path based on this module's location so scripts
    // work regardless of the current working directory.
    filename: join(__dirname, 'tickets.db'),
    driver: sqlite3.Database,
  });
}