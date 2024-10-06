-- DropForeignKey
ALTER TABLE `Podcast` DROP FOREIGN KEY `Podcast_currentHosterId_fkey`;

-- AlterTable
ALTER TABLE `Podcast` MODIFY `currentHosterId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_currentHosterId_fkey` FOREIGN KEY (`currentHosterId`) REFERENCES `User`(`discordId`) ON DELETE SET NULL ON UPDATE CASCADE;
