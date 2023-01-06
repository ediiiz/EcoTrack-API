import { prisma } from '../db/prisma.js';
import { createOrUpdateCar } from '../db/dbOperations.js';
import { getCoordinates } from './getCoordinates.js';

export async function loopOverData(data: Buffer) {
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
