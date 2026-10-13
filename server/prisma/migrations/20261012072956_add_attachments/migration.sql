-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "uploadedById" INTEGER NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'CLOUDINARY',
    "storagePublicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storagePublicId_key" ON "Attachment"("storagePublicId");

-- CreateIndex
CREATE INDEX "Attachment_taskId_createdAt_idx" ON "Attachment"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "Attachment_uploadedById_idx" ON "Attachment"("uploadedById");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
