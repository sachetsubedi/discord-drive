-- AlterTable
ALTER TABLE `uploaded_files` ADD COLUMN `discordAttachmentId` VARCHAR(50) NULL,
    ADD COLUMN `discordMessageId` VARCHAR(50) NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `discordUrl` VARCHAR(1000) NOT NULL;

-- CreateIndex
CREATE INDEX `uploaded_files_discordMessageId_idx` ON `uploaded_files`(`discordMessageId`);

-- CreateIndex
CREATE INDEX `uploaded_files_updatedAt_idx` ON `uploaded_files`(`updatedAt`);
