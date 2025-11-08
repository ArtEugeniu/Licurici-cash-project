import net from 'net';

const printerIP = '192.168.88.243';  // Твой IP
const printerPort = 9100;

const dplCommand = [
  "N",
  'A50,50,0,3,1,1,N,"Hello!"',
  "P1"
].join("\r\n") + "\r\n";

const client = new net.Socket();

client.connect(printerPort, printerIP, () => {
  client.write(dplCommand, 'utf8', () => {
    setTimeout(() => {
      client.end();
      console.log("Команда печати отправлена");
    }, 500);
  });
});

client.on('error', (err) => {
  console.error("Ошибка:", err);
});
