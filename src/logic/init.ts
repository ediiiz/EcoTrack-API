import { env } from 'process';
import { etrackAPI } from '../api/express.js';
import { prisma } from '../db/prisma.js';

export async function init() {
  await prisma.car.deleteMany({});
  etrackAPI.listen(env.APIPORT, () => {
    console.log(
      `API is running on http://${env.COMPUTERNAME}:${env.APIPORT}/cars`
    );
  });
}
