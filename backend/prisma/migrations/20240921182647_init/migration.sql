-- CreateTable
CREATE TABLE "Podcast" (
    "id" SERIAL NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "transcription" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("id")
);
