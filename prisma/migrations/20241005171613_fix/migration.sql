/*
  Warnings:

  - A unique constraint covering the columns `[currentHosterId]` on the table `Podcast` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `currentHosterId` to the `Podcast` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Podcast` ADD COLUMN `currentHosterId` VARCHAR(191) NOT NULL,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'INACTIVE';

-- CreateIndex
CREATE UNIQUE INDEX `Podcast_currentHosterId_key` ON `Podcast`(`currentHosterId`);

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_currentHosterId_fkey` FOREIGN KEY (`currentHosterId`) REFERENCES `User`(`discordId`) ON DELETE RESTRICT ON UPDATE CASCADE;
