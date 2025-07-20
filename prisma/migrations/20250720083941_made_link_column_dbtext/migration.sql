-- DropIndex
DROP INDEX `uploaded_files_discordUrl_key` ON `uploaded_files`;

-- AlterTable
ALTER TABLE `uploaded_files` MODIFY `discordUrl` LONGTEXT NOT NULL;
