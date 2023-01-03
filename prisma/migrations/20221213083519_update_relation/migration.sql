/*
  Warnings:

  - You are about to drop the `Coordinates` table. If the table is not empty, all the data it contains will be lost.
  - The primary key for the `Car` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `latitude` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `Car` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `Car` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Coordinates_carId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Coordinates";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Car" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "longitude" REAL NOT NULL,
    "latitude" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "updatedAt" DATETIME,

    PRIMARY KEY ("id", "name")
);
INSERT INTO "new_Car" ("id", "name") SELECT "id", "name" FROM "Car";
DROP TABLE "Car";
ALTER TABLE "new_Car" RENAME TO "Car";
CREATE UNIQUE INDEX "Car_name_key" ON "Car"("name");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
