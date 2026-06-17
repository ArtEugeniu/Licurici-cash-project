import { ticketsApi } from '../api/ticketsApi';
import type { TicketBatch, TicketSerialPointer } from '../api/types';

export type CurrentRollStock = {
  remaining: number;
  serialFrom: string;
  serialTo: string;
  nextSerial: string;
};

export type TicketStockInfo = {
  remaining: number;
  currentRoll: CurrentRollStock | null;
};

export function computeRemainingTickets(
  serialPointers: TicketSerialPointer[],
  batches: TicketBatch[]
): number {
  const batchMap = new Map(batches.map((batch) => [batch.id, Number(batch.number_to)]));

  return serialPointers.reduce((total, pointer) => {
    const numberTo = batchMap.get(pointer.batch_id);
    if (numberTo === undefined) return total;

    const current = Number(pointer.current_serial_number);
    if (!Number.isFinite(current) || !Number.isFinite(numberTo) || current >= numberTo) {
      return total;
    }

    return total + (numberTo - current);
  }, 0);
}

export function computeCurrentRollStock(
  serialPointers: TicketSerialPointer[],
  batches: TicketBatch[]
): CurrentRollStock | null {
  const batchMap = new Map(batches.map((batch) => [batch.id, batch]));
  const sortedPointers = [...serialPointers].sort((a, b) => a.batch_id - b.batch_id);

  for (const pointer of sortedPointers) {
    const batch = batchMap.get(pointer.batch_id);
    if (!batch) continue;

    const current = Number(pointer.current_serial_number);
    const numberTo = Number(batch.number_to);

    if (!Number.isFinite(current) || !Number.isFinite(numberTo) || current >= numberTo) {
      continue;
    }

    const serialWidth = String(batch.number_to).length;

    return {
      remaining: numberTo - current,
      serialFrom: String(batch.number_from),
      serialTo: String(batch.number_to),
      nextSerial: String(current + 1).padStart(serialWidth, '0'),
    };
  }

  return null;
}

async function fetchStockFromLegacyEndpoints(): Promise<TicketStockInfo> {
  const [serialPointers, batches] = await Promise.all([
    ticketsApi.getSerialPointers(),
    ticketsApi.getBatches(),
  ]);

  return {
    remaining: computeRemainingTickets(serialPointers, batches),
    currentRoll: computeCurrentRollStock(serialPointers, batches),
  };
}

export async function fetchTicketStockInfo(): Promise<TicketStockInfo> {
  try {
    const data = await ticketsApi.getRemaining<Partial<TicketStockInfo>>();
    return {
      remaining: Number(data.remaining ?? 0),
      currentRoll: data.currentRoll ?? null,
    };
  } catch {
    return fetchStockFromLegacyEndpoints();
  }
}

// Backwards-compatible helper
export async function fetchRemainingTicketsCount(): Promise<number> {
  const stock = await fetchTicketStockInfo();
  return stock.remaining;
}
