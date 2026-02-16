-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "file_name" VARCHAR(255),
ADD COLUMN     "file_url" TEXT,
ADD COLUMN     "type" VARCHAR(50) NOT NULL DEFAULT 'user';
