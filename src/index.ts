import net from 'net';
import { env } from 'process';
import { etrackAPI } from './api/express.js';
import { prisma } from './prisma/prisma.js';
import { createOrUpdateCar, findCar } from './prisma/dbOperations.js';
import { createTelnetConnection } from './createTelnetConnection.js';
import { getCoordinates } from './getCoordinates.js';
import { Sleep } from './utils/Sleep.js';

const tbLocations = {
  small: 27,
  medium: 22,
  big: 23,
};
export const connectionParams = {
  host: env.MTRACKHOST,
  port: tbLocations.big,
  timeout: 1500,
};

async function getData(connection: net.Socket) {
  connection.on('data', function (data: Buffer) {
    loopOverData(data);
  });
}

async function loopOverData(data: Buffer) {
  try {
    let arr = data.toString().split('^M^J');
    for (const key in arr) {
      let data = getCoordinates(arr[key]);
      if (typeof data !== 'undefined') {
        createOrUpdateCar(data);
      }
    }
    arr.length = 0;
  } catch (error) {
    prisma.$disconnect();
    console.log(error);
  }
}

//MAIN
async function main() {
  async function setup() {
    await prisma.car.deleteMany({});
    etrackAPI.listen(env.APIPORT, () => {
      console.log(`API is running on http://0.0.0.0:${env.APIPORT}`);
    });
  }
  setup();
  const connection = await createTelnetConnection();
  Sleep(2000);
  getData(connection);
  prisma.$on('beforeExit', async () => {
    console.log('beforeExit hook');
    prisma.$disconnect();
  });
}

main();

// prisma.$queryRaw`PRAGMA journal_mode = WAL;`
//   .then(() => {
//     console.log('ENABLED WAL MODE FOR DATABASE');
//   })
//   .catch((err) => {
//     console.log('DB SETUP FAILED', err);
//     process.exit(1);
//   });
// console.log(
//   await findCar('My car').catch((reason) => {
//     console.error(reason);
//   })
// );

// console.log(
//   createOrUpdateCar({ vehicle: 'fm016', lat: 54.487814, lng: 9.978481 })
// );
