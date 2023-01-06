import { env } from 'process';
import { prisma } from './db/prisma.js';
import {
  createTelnetConnection,
  getData,
} from './logic/createTelnetConnection.js';
import { init } from './logic/init.js';

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

//MAIN
async function main() {
  init();
  getData(await createTelnetConnection());
  prisma.$on('beforeExit', async () => {
    console.log('Datenbankverbindung wird geschlossen.');
    prisma.$disconnect();
  });
}

main();
