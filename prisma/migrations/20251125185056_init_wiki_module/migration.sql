-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "parentId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiArticle" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentPlain" TEXT NOT NULL,
    "excerpt" TEXT,
    "coverImage" TEXT,
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "categoryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WikiArticle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiArticleVersion" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiArticleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "WikiTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WikiSearchLog" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "userId" TEXT,
    "results" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WikiSearchLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WikiArticleToWikiTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WikiArticleToWikiTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WikiCategory_slug_key" ON "WikiCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WikiArticle_slug_key" ON "WikiArticle"("slug");

-- CreateIndex
CREATE INDEX "WikiArticle_categoryId_idx" ON "WikiArticle"("categoryId");

-- CreateIndex
CREATE INDEX "WikiArticle_authorId_idx" ON "WikiArticle"("authorId");

-- CreateIndex
CREATE INDEX "WikiArticle_status_idx" ON "WikiArticle"("status");

-- CreateIndex
CREATE INDEX "WikiArticleVersion_articleId_idx" ON "WikiArticleVersion"("articleId");

-- CreateIndex
CREATE UNIQUE INDEX "WikiTag_name_key" ON "WikiTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "WikiTag_slug_key" ON "WikiTag"("slug");

-- CreateIndex
CREATE INDEX "_WikiArticleToWikiTag_B_index" ON "_WikiArticleToWikiTag"("B");

-- AddForeignKey
ALTER TABLE "WikiCategory" ADD CONSTRAINT "WikiCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "WikiCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiArticle" ADD CONSTRAINT "WikiArticle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "WikiCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiArticle" ADD CONSTRAINT "WikiArticle_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiArticleVersion" ADD CONSTRAINT "WikiArticleVersion_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "WikiArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WikiArticleVersion" ADD CONSTRAINT "WikiArticleVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WikiArticleToWikiTag" ADD CONSTRAINT "_WikiArticleToWikiTag_A_fkey" FOREIGN KEY ("A") REFERENCES "WikiArticle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WikiArticleToWikiTag" ADD CONSTRAINT "_WikiArticleToWikiTag_B_fkey" FOREIGN KEY ("B") REFERENCES "WikiTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
