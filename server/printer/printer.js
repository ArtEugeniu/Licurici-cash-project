import net from "net";

const DPI = 200;
const MM_TO_DOTS = DPI / 25.4; 
const TICKET_WIDTH_MM = 85;
const TICKET_HEIGHT_MM = 55;

const TICKET_WIDTH_DOTS = Math.round(TICKET_WIDTH_MM * MM_TO_DOTS); 
const TICKET_HEIGHT_DOTS = Math.round(TICKET_HEIGHT_MM * MM_TO_DOTS); 

export function generateDPL(ticket) {
  const { title, date, time, price, quantity = 1 } = ticket;

  return `
N
q${TICKET_WIDTH_DOTS}
Q${TICKET_HEIGHT_DOTS}
A80,120,1,4,1,1,N,"${title}" 
A50,140,1,3,1,1,N,"${date}"
A50,160,1,3,1,1,N,"${time}"
A50,180,1,3,1,1,N,"Цена: ${price}"
P${quantity}
\r\n`;
}

export async function printTicketDPL(ticket) {
  const printerIP = "192.168.1.100"; 
  const printerPort = 9100;          

  const dplCommand = generateDPL(ticket);

  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.connect(printerPort, printerIP, () => {
      client.write(dplCommand, () => {
        client.end();
        resolve(true);
      });
    });

    client.on("error", (err) => {
      reject(err);
    });
  });
}
