import { createHmac } from 'crypto';
import { Telnet } from 'telnet-client';
import { PrismaClient } from '@prisma/client';
import express from 'express';
import cors from 'cors';

const prisma = new PrismaClient();
const PORT = 3125;
const app = express().use(cors());
const mtrackHost = 'dyhvs107.dy.droot.org';
const tbLocations = {
  small: 27,
  medium: 22,
  big: 23,
};
const telnetCMD = {
  auth: 'AUTH -SASL CRAM-MD5',
  gprsOn: 'GPRS ON',
};
const connectionParams = {
  host: mtrackHost,
  port: tbLocations.big,
  negotiationMandatory: false,
  timeout: 1500,
  irs: '',
  echoLines: 0,
};
const reCollection = {
  GPRMD: /GPRMD/m,
  VehicleName: /\$(.*)\$/m,
  Coordinates: /A,(.*),N,(.*),E/g,
  DegreesMinutes: /(.*)(\d\d)\./m,
  Seconds: /\.(.*)/m,
};

function generateAnswer(challenge: string) {
  let username = 'dyckerhoff';
  let password = 'dyckerhoff';
  challenge = Buffer.from(challenge, 'base64').toString();
  const digest = createHmac('md5', password).update(challenge).digest('hex');
  const hash = Buffer.from(`${username} ${digest}`, 'binary').toString(
    'base64'
  );
  return hash;
}

async function runTelnet() {
  async function sendAndWaitForData({
    connection,
    cmd,
  }: {
    connection: Telnet;
    cmd: string;
  }) {
    await connection.write(`${cmd}\n`);
    const res = await connection.nextData();
    return res;
  }

  async function connectToTelnet(params: {
    host: string;
    port: number;
    negotiationMandatory: boolean;
    timeout: number;
    irs: string;
    echoLines: number;
  }) {
    const connection = new Telnet();
    await connection.connect(params);
    return connection;
  }

  async function authenticateTelnet(connection: Telnet) {
    const res = await sendAndWaitForData({ connection, cmd: telnetCMD.auth });
    const challenge = res?.split(' ')[1];
    if (challenge !== undefined) {
      const hash = generateAnswer(challenge);
      return await sendAndWaitForData({ connection, cmd: hash });
    }
    return null;
  }

  async function enableGPRS(connection: Telnet) {
    return await sendAndWaitForData({ connection, cmd: telnetCMD.gprsOn });
  }

  const connection = await connectToTelnet(connectionParams);
  await connection.nextData();
  await authenticateTelnet(connection);
  await enableGPRS(connection);
  connection.on('data', function (response: string) {
    loopOverArr(Buffer.from(response, 'hex').toString());
  });
}

function getCoordinates(input: string) {
  function DMM2DD({ DMM }: { DMM: string }) {
    const matches = DMM.match(reCollection.DegreesMinutes);
    if (matches) {
      const degrees = parseInt(matches[1]);
      const minutes = parseInt(matches[2].replace('0', ''));
      const seconds = parseFloat(`.${DMM.match(reCollection.Seconds)?.[1]}`);
      const decimalDegress = degrees + (minutes + seconds) / 60;
      return parseFloat(decimalDegress.toFixed(6));
    }
  }

  function getData(input: string): {
    vehicle: string;
    north: string;
    east: string;
  } {
    const matches = input.match(reCollection.GPRMD);
    if (matches && matches[0]) {
      const vehicle = input.match(reCollection.VehicleName)?.[1];
      for (const match of input.matchAll(reCollection.Coordinates)) {
        const data = {
          vehicle,
          north: match[1],
          east: match[2],
        };
        return data;
      }
    } else {
      return { vehicle: undefined, north: undefined, east: undefined };
    }
  }

  const data = getData(input);

  if (typeof data !== 'undefined' && typeof data.vehicle !== 'undefined') {
    const { vehicle, north, east } = data;
    const lat = DMM2DD({ DMM: north });
    const lng = DMM2DD({ DMM: east });
    return { vehicle, lat, lng };
  } else {
    return undefined;
  }
}

async function loopOverArr(response: string) {
  try {
    const arr = response.split('^M^J');
    for (const key in arr) {
      const data = getCoordinates(arr[key]);
      if (typeof data !== 'undefined') {
        console.log(data);
        createOrUpdateCar(data);
      }
    }
    arr.length = 0;
  } catch (error) {
    prisma.$disconnect();
    console.log(error);
  }
}

async function findCar(vehicle: string) {
  const car = await prisma.car.findUnique({
    where: {
      name: vehicle,
    },
  });
  return car;
}

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
  return car;
}

// Define the endpoint for default Message
app.get('/', async (req, res) => {
  res.send('ETrack API - /cars - /cars/:id');
});

// Define the endpoint for returning all cars
app.get('/cars', async (req, res) => {
  // Use the Prisma client to query the cars from the database
  const cars = await prisma.car.findMany();

  // Return the cars as a JSON response
  res.json(cars);
});

// Define the endpoint for returning all cars
app.get('/carsOnline', async (req, res) => {
  // Use the Prisma client to query the cars from the database
  const cars = await prisma.car.findMany({
    where: {
      NOT: {
        updatedAt: null,
      },
    },
  });

  // Return the cars as a JSON response
  res.json(cars);
});

// Define the endpoint for returning selected cars
app.get('/cars/:id', async (req, res) => {
  const { id }: { id: string } = req.params;
  // Use the Prisma client to query the car by its ID
  const car = await findCar(id);
  // Return the car as a JSON response
  res.json(car);
});

//MAIN
function main() {
  async function setup() {
    await prisma.car.deleteMany({});
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  }
  setup();
  runTelnet();
  prisma.$on('beforeExit', async () => {
    console.log('beforeExit hook');
    // PrismaClient still available
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
