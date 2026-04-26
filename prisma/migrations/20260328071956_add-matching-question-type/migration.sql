-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MATCHING');

ALTER TABLE "Question" ADD COLUMN "questionType" TEXT NOT NULL DEFAULT 'SINGLE_CHOICE';
ALTER TABLE "Question" ALTER COLUMN "correctAnswer" TYPE TEXT USING "correctAnswer"::text;
ALTER TABLE "Question" ADD COLUMN "matchItems" TEXT[] DEFAULT ARRAY[]::text[];
ALTER TABLE "Question" ADD COLUMN "matchItemsZh" TEXT[] DEFAULT ARRAY[]::text[];

ALTER TABLE "ExamAnswer" ALTER COLUMN "selectedAnswer" TYPE TEXT USING "selectedAnswer"::text;
