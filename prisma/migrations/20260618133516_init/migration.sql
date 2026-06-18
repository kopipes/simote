-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "note_fields" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldValue" TEXT NOT NULL,
    "isSensitive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "note_fields_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "note_categories" (
    "noteId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    PRIMARY KEY ("noteId", "categoryId"),
    CONSTRAINT "note_categories_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "note_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trashed_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "noteId" TEXT NOT NULL,
    "deletedById" TEXT NOT NULL,
    "deletedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "restoredAt" DATETIME,
    "restoredById" TEXT,
    CONSTRAINT "trashed_items_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "trashed_items_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "trashed_items_restoredById_fkey" FOREIGN KEY ("restoredById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "trashed_items_noteId_key" ON "trashed_items"("noteId");
