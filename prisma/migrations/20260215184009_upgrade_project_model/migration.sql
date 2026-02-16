-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "advance_amount" DECIMAL(10,2),
ADD COLUMN     "assigned_lead_id" TEXT,
ADD COLUMN     "client_email" VARCHAR(255),
ADD COLUMN     "client_name" VARCHAR(255),
ADD COLUMN     "client_phone" VARCHAR(50),
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "maintenance_plan" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priority" VARCHAR(50) NOT NULL DEFAULT 'medium',
ADD COLUMN     "project_type" VARCHAR(50) NOT NULL DEFAULT 'website',
ADD COLUMN     "revision_limit" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "total_amount" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "projects_assigned_lead_id_idx" ON "projects"("assigned_lead_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_assigned_lead_id_fkey" FOREIGN KEY ("assigned_lead_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
