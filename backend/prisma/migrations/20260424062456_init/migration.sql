-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "equipment" TEXT,
    "tags" TEXT,
    "notes" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "demoMediaType" TEXT,
    "demoMediaUrl" TEXT,
    "demoMediaAssetId" TEXT,
    CONSTRAINT "Exercise_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Exercise_demoMediaAssetId_fkey" FOREIGN KEY ("demoMediaAssetId") REFERENCES "ExerciseMediaAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseMediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciseMediaAsset_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkoutTemplate_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutTemplateExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "WorkoutTemplateExercise_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutTemplateExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateSetPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateExerciseId" TEXT NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "targetReps" INTEGER,
    "targetWeight" REAL,
    CONSTRAINT "TemplateSetPlan_templateExerciseId_fkey" FOREIGN KEY ("templateExerciseId") REFERENCES "WorkoutTemplateExercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "deviceId" TEXT NOT NULL,
    "templateId" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "WorkoutSession_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSession_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkoutTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutSessionExercise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "WorkoutSessionExercise_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkoutSessionExercise_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkoutSessionSet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionExerciseId" TEXT NOT NULL,
    "setIndex" INTEGER NOT NULL,
    "plannedReps" INTEGER,
    "plannedWeight" REAL,
    "actualReps" INTEGER,
    "actualWeight" REAL,
    CONSTRAINT "WorkoutSessionSet_sessionExerciseId_fkey" FOREIGN KEY ("sessionExerciseId") REFERENCES "WorkoutSessionExercise" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Exercise_deviceId_idx" ON "Exercise"("deviceId");

-- CreateIndex
CREATE INDEX "Exercise_deviceId_name_idx" ON "Exercise"("deviceId", "name");

-- CreateIndex
CREATE INDEX "ExerciseMediaAsset_deviceId_idx" ON "ExerciseMediaAsset"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseMediaAsset_deviceId_sha256_key" ON "ExerciseMediaAsset"("deviceId", "sha256");

-- CreateIndex
CREATE INDEX "WorkoutTemplate_deviceId_idx" ON "WorkoutTemplate"("deviceId");

-- CreateIndex
CREATE INDEX "WorkoutTemplateExercise_templateId_idx" ON "WorkoutTemplateExercise"("templateId");

-- CreateIndex
CREATE INDEX "WorkoutTemplateExercise_exerciseId_idx" ON "WorkoutTemplateExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutTemplateExercise_templateId_sortOrder_key" ON "WorkoutTemplateExercise"("templateId", "sortOrder");

-- CreateIndex
CREATE INDEX "TemplateSetPlan_templateExerciseId_idx" ON "TemplateSetPlan"("templateExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSetPlan_templateExerciseId_setIndex_key" ON "TemplateSetPlan"("templateExerciseId", "setIndex");

-- CreateIndex
CREATE INDEX "WorkoutSession_deviceId_startedAt_idx" ON "WorkoutSession"("deviceId", "startedAt");

-- CreateIndex
CREATE INDEX "WorkoutSession_templateId_idx" ON "WorkoutSession"("templateId");

-- CreateIndex
CREATE INDEX "WorkoutSessionExercise_sessionId_idx" ON "WorkoutSessionExercise"("sessionId");

-- CreateIndex
CREATE INDEX "WorkoutSessionExercise_exerciseId_idx" ON "WorkoutSessionExercise"("exerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSessionExercise_sessionId_sortOrder_key" ON "WorkoutSessionExercise"("sessionId", "sortOrder");

-- CreateIndex
CREATE INDEX "WorkoutSessionSet_sessionExerciseId_idx" ON "WorkoutSessionSet"("sessionExerciseId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutSessionSet_sessionExerciseId_setIndex_key" ON "WorkoutSessionSet"("sessionExerciseId", "setIndex");
