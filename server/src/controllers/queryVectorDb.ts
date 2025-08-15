import type { Request, Response, NextFunction, RequestHandler } from "express";
import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import type { ServerError, TranslatorMetadata } from "../types/types";

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
const INDEX = process.env.PINECONE_INDEX!;

export const queryVectorDb: RequestHandler = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const vector = res.locals.embeddedQuery;
    if (!Array.isArray(vector) || vector.length !== 1536) {
      const error: ServerError = {
        log: "queryVectorDb: missing/invalid embeddedQuery",
        status: 500,
        message: { err: "embeddedQuery missing or wrong dimension (1536 required)" },
      };
      return next(error);
    }

    const index = pc.index<TranslatorMetadata>(INDEX)

    const results = await index.query({
      vector,
      topK: 5,
      includeMetadata: true,
    });

    res.locals.pineconeQueryResult =
      results.matches?.map((m) => ({
        id: m.id,
        score: m.score,
        metadata: m.metadata as TranslatorMetadata | undefined,
      })) ?? [];

    return next();
  } catch (err) {
    const error: ServerError = {
      log: `queryVectorDb: ${String(err)}`,
      status: 500,
      message: { err: "An error occurred while querying database" },
    };
    return next(error);
  }
};
