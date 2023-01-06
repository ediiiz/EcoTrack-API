import express from 'express';
import cors from 'cors';
import { prisma } from '../db/prisma.js';
import { findCar } from '../db/dbOperations.js';

const etrackAPI = express().use(cors());

// Define the endpoint for default Message
etrackAPI.get('/', async (req, res) => {
  res.send('ETrack API - /cars - /cars/:id');
});

// Define the endpoint for returning all cars
etrackAPI.get('/cars', async (req, res) => {
  // Use the Prisma client to query the cars from the database
  const cars = await prisma.car.findMany();
  // Return the cars as a JSON response
  res.json(cars);
});

// Define the endpoint for returning all cars
etrackAPI.get('/carsOnline', async (req, res) => {
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
etrackAPI.get('/cars/:id', async (req, res) => {
  const { id }: { id: string } = req.params;
  // Use the Prisma client to query the car by its ID
  const car = await findCar(id);
  // Return the car as a JSON response
  res.json(car);
});

export { etrackAPI };
