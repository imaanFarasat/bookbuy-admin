-- AlterTable
ALTER TABLE `page` ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'general';

-- CreateIndex
CREATE INDEX `page_category_idx` ON `page`(`category`);
