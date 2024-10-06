/*
  Warnings:

  - Added the required column `audienceRoleId` to the `Podcast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Podcast` ADD COLUMN `audienceRoleId` VARCHAR(191) NOT NULL;
