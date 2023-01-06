import net from 'net';
import { env } from 'process';
import { generateAnswer } from './generateAnswer.js';
import { connectionParams } from '../index.js';
import { loopOverData } from './loopOverData.js';
import { Sleep } from '../utils/Sleep.js';

async function createTelnetConnection(): Promise<net.Socket> {
  function connectToTelnet(params: {
    host: string;
    port: number;
    timeout: number;
  }) {
    return new Promise<net.Socket>((resolve, reject) => {
      const connection = net.createConnection(params, () => {
        resolve(connection);
      });
      connection.on('error', (err: Error) => {
        reject(err);
      });
    });
  }

  async function sendAndWaitForData({
    connection,
    cmd,
  }: {
    connection: net.Socket;
    cmd: string;
  }) {
    connection.write(`${cmd}\n`);
    return new Promise<string>((resolve) => {
      connection.once('data', (data: Buffer) => {
        resolve(data.toString());
      });
    });
  }

  async function authenticateTelnet(connection: net.Socket) {
    const res = await sendAndWaitForData({
      connection,
      cmd: 'AUTH -SASL CRAM-MD5',
    });
    const challenge = res?.split(' ')[1];
    if (challenge !== undefined) {
      const hash = generateAnswer(challenge);
      return await sendAndWaitForData({ connection, cmd: hash });
    }
    return null;
  }

  async function enableGPRS(connection: net.Socket) {
    return await sendAndWaitForData({ connection, cmd: 'GPRS ON' });
  }

  function nextData(connection: net.Socket): Promise<string | null> {
    return new Promise((resolve) => {
      connection.once('data', (data: Buffer) => {
        resolve(data.toString());
      });
      connection.once('end', () => {
        resolve(null);
      });
    });
  }

  const connection = await connectToTelnet(connectionParams).catch(() => {
    throw new Error(
      `Verbindung konnte nicht hergestellt werden, Netzwerkverbindung, Port oder Host pruefen! \n HOST: ${env.MTRACKHOST}`
    );
  });
  const data = await nextData(connection);
  console.log(data);
  await authenticateTelnet(connection);
  await enableGPRS(connection);
  Sleep(2000);
  return connection;
}

async function getData(connection: net.Socket) {
  connection.on('data', function (data: Buffer) {
    loopOverData(data);
  });
}

export { getData, createTelnetConnection };
