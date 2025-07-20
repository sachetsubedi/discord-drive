-- AlterTable
ALTER TABLE `uploaded_files` ADD COLUMN `deleted` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `uploaded_files_deleted_idx` ON `uploaded_files`(`deleted`);
