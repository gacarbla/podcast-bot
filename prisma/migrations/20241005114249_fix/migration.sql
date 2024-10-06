/*
  Warnings:

  - You are about to drop the column `podcasterId` on the `Podcast` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `Podcast` DROP FOREIGN KEY `Podcast_podcasterId_fkey`;

-- AlterTable
ALTER TABLE `Podcast` DROP COLUMN `podcasterId`,
    MODIFY `timeLogsChannelId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `_ManagedPodcasts` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ManagedPodcasts_AB_unique`(`A`, `B`),
    INDEX `_ManagedPodcasts_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_ManagedPodcasts` ADD CONSTRAINT `_ManagedPodcasts_A_fkey` FOREIGN KEY (`A`) REFERENCES `Podcast`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ManagedPodcasts` ADD CONSTRAINT `_ManagedPodcasts_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
