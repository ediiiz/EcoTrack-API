import { prisma } from './prisma.js';

async function createOrUpdateCar({
  vehicle,
  lat,
  lng,
}: {
  vehicle: string;
  lat: number;
  lng: number;
}) {
  const car = await prisma.car.upsert({
    where: {
      name: vehicle,
    },
    create: {
      name: vehicle,
      longitude: lng,
      latitude: lat,
      timestamp: new Date(),
    },
    update: {
      name: vehicle,
      longitude: lng,
      latitude: lat,
      updatedAt: new Date(),
    },
  });
  //console.log({ car: car.name, lat: car.latitude, lng: car.longitude });
  return car;
}

async function findCar(vehicle: string) {
  const car = await prisma.car.findUnique({
    where: {
      name: vehicle,
    },
  });
  return car;
}

export { findCar, createOrUpdateCar };
