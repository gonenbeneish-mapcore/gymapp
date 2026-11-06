import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { importPrecorStrengthMachinesFromPdf } from "./precor/importStrengthFromSpecTables.js";

const prisma = new PrismaClient();

const app = Fastify({
  logger: true,
});

// Allow empty-body POSTs (handy for bootstrap/seed calls)
app.addContentTypeParser("*", { parseAs: "string" }, (_req, body, done) => {
  if (body === "" || body === undefined || body === null) return done(null, null);
  return done(null, body);
});

await app.register(cors, {
  origin: true,
});

await app.register(multipart, {
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

function getDeviceId(req: { headers: Record<string, unknown> }) {
  const v = req.headers["x-device-id"];
  if (typeof v === "string" && v.length > 0) return v;
  return null;
}

app.get("/health", async () => ({ ok: true }));

// ---- Device bootstrap (no-auth) ----
app.post("/v1/device/bootstrap", async (_req, reply) => {
  reply.header("content-type", "application/json; charset=utf-8");
  const device = await prisma.device.create({ data: {} });
  return { deviceId: device.id };
});

// ---- Exercises ----
const ExerciseUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  equipment: z.string().optional().nullable(),
  tags: z.string().optional().nullable(), // comma-separated for now
  notes: z.string().optional().nullable(),
  archived: z.boolean().optional(),
  demoMediaType: z.enum(["video", "gif", "lottie"]).optional().nullable(),
  demoMediaUrl: z.string().url().optional().nullable(),
  demoMediaAssetId: z.string().uuid().optional().nullable(),
});

app.get("/v1/exercises", async (req, reply) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return reply.code(400).send({ error: "Missing X-Device-Id" });

  const exercises = await prisma.exercise.findMany({
    where: { deviceId, archived: false },
    orderBy: [{ name: "asc" }],
  });
  return { exercises };
});

app.post("/v1/exercises", async (req, reply) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return reply.code(400).send({ error: "Missing X-Device-Id" });

  const body = ExerciseUpsertSchema.parse(req.body);
  const created = await prisma.exercise.create({
    data: {
      deviceId,
      name: body.name,
      equipment: body.equipment ?? null,
      tags: body.tags ?? null,
      notes: body.notes ?? null,
      archived: body.archived ?? false,
      demoMediaType: body.demoMediaType ?? null,
      demoMediaUrl: body.demoMediaUrl ?? null,
      demoMediaAssetId: body.demoMediaAssetId ?? null,
    },
  });
  return { exercise: created };
});

app.patch("/v1/exercises/:id", async (req, reply) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return reply.code(400).send({ error: "Missing X-Device-Id" });

  const id = z.string().uuid().parse((req.params as any).id);
  const body = ExerciseUpsertSchema.partial().parse(req.body);
  const updated = await prisma.exercise.update({
    where: { id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.equipment !== undefined ? { equipment: body.equipment } : {}),
      ...(body.tags !== undefined ? { tags: body.tags } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.archived !== undefined ? { archived: body.archived } : {}),
      ...(body.demoMediaType !== undefined ? { demoMediaType: body.demoMediaType } : {}),
      ...(body.demoMediaUrl !== undefined ? { demoMediaUrl: body.demoMediaUrl } : {}),
      ...(body.demoMediaAssetId !== undefined ? { demoMediaAssetId: body.demoMediaAssetId } : {}),
    },
  });

  if (updated.deviceId !== deviceId) {
    return reply.code(403).send({ error: "Forbidden" });
  }

  return { exercise: updated };
});

// ---- Seed: Precor strength machines ----
app.post("/v1/exercises/seed/precor-strength", async (req, reply) => {
  const deviceId = getDeviceId(req);
  if (!deviceId) return reply.code(400).send({ error: "Missing X-Device-Id" });

  const { machines, sourceUrl } = await importPrecorStrengthMachinesFromPdf();

  const existing = await prisma.exercise.findMany({
    where: { deviceId },
    select: { name: true },
  });
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()));

  let createdCount = 0;
  for (const m of machines) {
    const name = `${m.name} (${m.model})`;
    if (existingNames.has(name.toLowerCase())) continue;
    await prisma.exercise.create({
      data: {
        deviceId,
        name,
        equipment: "Precor machine",
        tags: `precor,${m.line}`,
        notes: `Imported from Precor spec tables: ${sourceUrl}`,
      },
    });
    createdCount++;
  }

  return {
    ok: true,
    createdCount,
    totalFoundInCatalog: machines.length,
    sourceUrl,
  };
});

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? "0.0.0.0";
await app.listen({ port, host });

