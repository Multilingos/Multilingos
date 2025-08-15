// server/src/controllers/queryAi.ts
import type { Request, Response, NextFunction, RequestHandler } from "express";
import OpenAI from "openai";
import "dotenv/config";
import type { ServerError, TranslatorMetadata } from "../types/types";

// ---- OpenAI client ----
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---- Embedding model ----
const EMBED_MODEL = "text-embedding-3-small"; // 1536-dim

/**
 * Create an embedding for the parsed user query (res.locals.inputQuery)
 * and store it at res.locals.embeddedQuery (number[]).
 */
export const queryAiEmbedding: RequestHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inputQuery = res.locals.inputQuery as string | undefined;
    if (!inputQuery) {
      const error: ServerError = {
        log: "queryAiEmbedding: missing res.locals.inputQuery",
        status: 500,
        message: { err: "No user query before embedding" },
      };
      return next(error);
    }

    const resp = await openai.embeddings.create({
      model: EMBED_MODEL,
      input: inputQuery.trim(),
      encoding_format: "float",
    });

    const vec = resp.data?.[0]?.embedding;
    if (!Array.isArray(vec)) {
      const error: ServerError = {
        log: "queryAiEmbedding: embedding not returned",
        status: 500,
        message: { err: "OpenAI did not return an embedding" },
      };
      return next(error);
    }

    res.locals.embeddedQuery = vec;
    return next();
  } catch (err) {
    const error: ServerError = {
      log: `queryAiEmbedding: ${String(err)}`,
      status: 500,
      message: { err: "An error occurred while creating embedding" },
    };
    return next(error);
  }
};

// ------- helper to compact a Pinecone hit into prompt-friendly text -------
function fmt(m: { id: string; score?: number; metadata?: TranslatorMetadata }) {
  const md = m.metadata ?? ({} as TranslatorMetadata);
  const examples = Array.isArray((md as any).context_examples)
    ? ((md as any).context_examples as string[]).slice(0, 2) // keep prompt small
    : [];
  return [
    `id: ${m.id}`,
    `score: ${typeof m.score === "number" ? m.score.toFixed(3) : "-"}`,
    `lang: ${md.lang ?? "-"}`,
    `text: ${md.text ?? "-"}`,
    `translation: ${md.translation ?? "-"}`,
    `pinyin: ${md.pinyin ?? "-"}`,
    examples.length ? `examples:\n- ${examples.join("\n- ")}` : "examples: -",
  ].join("\n");
}

/**
 * Use Pinecone results (res.locals.pineconeQueryResult) + userQuery to ask OpenAI
 * for a concise bilingual explanation with usage & pinyin. Stores Markdown in
 * res.locals.aiOutput for the route handler to return.
 */
export const aiCompletion: RequestHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userQuery = res.locals.inputQuery as string | undefined;
    const hits = res.locals.pineconeQueryResult as Array<{
      id: string;
      score?: number;
      metadata?: TranslatorMetadata;
    }> | undefined;

    if (!userQuery) {
      const error: ServerError = {
        log: "aiCompletion: missing userQuery",
        status: 500,
        message: { err: "No user query before OpenAI" },
      };
      return next(error);
    }
    if (!hits || !Array.isArray(hits) || hits.length === 0) {
      const error: ServerError = {
        log: "aiCompletion: empty pinecone results",
        status: 500,
        message: { err: "No vector matches to build a report" },
      };
      return next(error);
    }

    // sort by score desc; use all results you retrieved (e.g., topK=5)
    const selected = [...hits].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    const ragContext = selected.map(fmt).join("\n\n");

    const system = `
You are a bilingual English-Chinese tutor.

Return ONLY **Markdown** with this exact structure and spacing.
Use brief lines and bullet lists. Each bullet on its own line.

### Translation
- **English → Chinese**: <text>
- **Chinese → English**: <text or "—">
- **Pinyin**: <text or "—">
\n
### Usage
- Example 1 (EN): <sentence>
- 示例 1 (ZH): <sentence>（拼音：<pinyin>)
\n
- Example 2 (EN): <sentence>
- 示例 2 (ZH): <sentence>（拼音：<pinyin>)
\n
### Notes
- <one short nuance or tip>

Rules:
- Use ONLY the provided retrieved entries (RAG context).
- Prefer higher scored entries when deciding meanings/nuance.
- Include pinyin when Chinese appears.
- Keep it beginner friendly and concise.
`.trim();

    const userMsg = `
User Query:
${userQuery}

Retrieved Context (highest score first):
${ragContext}
`.trim();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
      max_tokens: 600,
    });

    const content = completion.choices?.[0]?.message?.content?.trim();
    if (!content) {
      const error: ServerError = {
        log: "aiCompletion: OpenAI returned empty content",
        status: 500,
        message: { err: "OpenAI did not return a completion" },
      };
      return next(error);
    }

    // Your server expects res.locals.aiOutput
    res.locals.aiOutput = content;
    // Optionally pass through what was used
    res.locals.topMatchesUsed = selected;

    return next();
  } catch (err) {
    const error: ServerError = {
      log: `aiCompletion: ${String(err)}`,
      status: 500,
      message: { err: "An error occurred while querying OpenAI" },
    };
    return next(error);
  }
};
