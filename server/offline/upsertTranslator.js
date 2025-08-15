import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.resolve(__dirname, "embedded_translator_data.json");
const nsIdx = process.argv.findIndex((a) => a === "--ns");

const EXPECTED_DIM = Number(process.env.EMBED_DIM || 1536);
const BATCH_SIZE = Number(process.env.BATCH || 200);

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
if (!PINECONE_API_KEY || !PINECONE_INDEX) {
  console.error("Missing PINECONE_API_KEY or PINECONE_INDEX env vars.");
  process.exit(1);
}

const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pc.index(PINECONE_INDEX);

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

function validateItem(it, i) {
  if (!it || typeof it !== "object") throw new Error(`Row ${i}: not an object`);
  if (!it.id) throw new Error(`Row ${i}: missing id`);
  if (!Array.isArray(it.values)) throw new Error(`Row ${i}: values must be array`);
  if (it.values.length !== EXPECTED_DIM) {
    throw new Error(
      `Row ${i}: embedding dim ${it.values.length} != expected ${EXPECTED_DIM}`
    );
  }
  if (!it.metadata || typeof it.metadata.text !== "string") {
    throw new Error(`Row ${i}: missing metadata.text`);
  }
}

async function loadItems(relPath) {
  const filePath = path.isAbsolute(relPath)
    ? relPath
    : path.resolve(__dirname, relPath);
  const raw = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Input JSON must be an array");
  data.forEach(validateItem);
  console.log(`Loaded ${data.length} vectors from ${filePath}`);
  return data;
}

async function upsertBatches(batches) {
  const results = await Promise.allSettled(
    batches.map(async (batch, i) => {
      const first = batch[0]?.id;
      const last = batch[batch.length - 1]?.id;
      console.log(`Upserting batch ${i + 1}/${batches.length}: ${first} → ${last}`);
      return index.upsert(batch);
    })
  );

  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`✅ Batch ${i + 1} upserted.`);
    } else {
      console.error(`❌ Batch ${i + 1} failed:`, r.reason);
    }
  });
}

async function main() {
  console.log(`Index: ${PINECONE_INDEX}`);
  const items = await loadItems(INPUT_FILE);
  
  const records = items.map((it) => ({
    id: it.id,
    values: it.values,
    metadata: it.metadata,
  }));

  const batches = chunk(records, BATCH_SIZE);
  await upsertBatches(batches);
  console.log("🎉 Done.");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});