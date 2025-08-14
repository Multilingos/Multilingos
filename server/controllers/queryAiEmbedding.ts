import type { Request, Response, NextFunction, RequestHandler } from 'express';
import OpenAI from 'openai';
import { ServerError } from '../src/types/types'
import 'dotenv/config'; 

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'text-embedding-3-small';

export const queryAiEmbedding: RequestHandler = async (
 _req: Request,
  res: Response,
  next: NextFunction
) => {
  const {inputQuery} = res.locals
  if(!inputQuery){
    const error: ServerError = {
        log: 'queryOpenAIEmbedding did not receive a user query',
        status: 500,
        message: { err: 'An error occurred before querying OpenAI' },
    };
    return next(error);
  }
  try {
    const embedding = await openai.embeddings.create({
      model: MODEL,
      //just to make sure clean out the whitespace
      input: inputQuery.trim(),
      encoding_format: "float",
    });

    res.locals.embeddedQuery = embedding.data?.[0]?.embedding || undefined;

    return next();

  } catch (err) {
    const error: ServerError = {
      log: `queryOpenAI: Error: OpenAI error: ${err}`,
      status: 500,
      message: { err: 'An error occurred while querying OpenAI' },
    };
    
    return next(error);
  }
};
