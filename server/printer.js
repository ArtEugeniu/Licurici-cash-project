import net from "net";


export function generateDPL(ticket) {
  const { title, date, time, price, quantity = 1 } = ticket;

  return `
N
A80,120,0,4,1,1,N,"${title}"
A50,140,0,3,1,1,N,"${date}"
A50,150,0,3,1,1,N,"${time}"
A50,160,0,3,1,1,N,"Цена: ${price}"
P${quantity}
`;
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
