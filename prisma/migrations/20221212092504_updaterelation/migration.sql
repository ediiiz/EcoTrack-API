/*
  Warnings:

  - A unique constraint covering the columns `[carId]` on the table `Coordinates` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Coordinates_carId_key" ON "Coordinates"("carId");
