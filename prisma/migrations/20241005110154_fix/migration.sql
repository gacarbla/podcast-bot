/*
  Warnings:

  - Added the required column `logsChannelId` to the `Podcast` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Podcast` DROP FOREIGN KEY `Podcast_announcementChannelId_fkey`;

-- DropForeignKey
ALTER TABLE `Podcast` DROP FOREIGN KEY `Podcast_chatChannelId_fkey`;

-- DropForeignKey
ALTER TABLE `Podcast` DROP FOREIGN KEY `Podcast_guildId_fkey`;

-- DropForeignKey
ALTER TABLE `Podcast` DROP FOREIGN KEY `Podcast_podcasterId_fkey`;

-- DropForeignKey
ALTER TABLE `Podcast` DROP FOREIGN KEY `Podcast_stageChannelId_fkey`;

-- DropForeignKey
ALTER TABLE `Podcast` DROP FOREIGN KEY `Podcast_timeLogsChannelId_fkey`;

-- AlterTable
ALTER TABLE `Podcast` ADD COLUMN `logsChannelId` VARCHAR(191) NOT NULL,
    MODIFY `guildId` VARCHAR(191) NOT NULL,
    MODIFY `podcasterId` VARCHAR(191) NULL,
    MODIFY `stageChannelId` VARCHAR(191) NOT NULL,
    MODIFY `chatChannelId` VARCHAR(191) NOT NULL,
    MODIFY `timeLogsChannelId` VARCHAR(191) NOT NULL,
    MODIFY `announcementChannelId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Server`(`discordId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_podcasterId_fkey` FOREIGN KEY (`podcasterId`) REFERENCES `User`(`discordId`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_stageChannelId_fkey` FOREIGN KEY (`stageChannelId`) REFERENCES `Channel`(`discordId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_chatChannelId_fkey` FOREIGN KEY (`chatChannelId`) REFERENCES `Channel`(`discordId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_timeLogsChannelId_fkey` FOREIGN KEY (`timeLogsChannelId`) REFERENCES `Channel`(`discordId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_announcementChannelId_fkey` FOREIGN KEY (`announcementChannelId`) REFERENCES `Channel`(`discordId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Podcast` ADD CONSTRAINT `Podcast_logsChannelId_fkey` FOREIGN KEY (`logsChannelId`) REFERENCES `Channel`(`discordId`) ON DELETE CASCADE ON UPDATE CASCADE;
