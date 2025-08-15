import type { Request, Response, NextFunction, RequestHandler } from 'express';
import OpenAI from 'openai';
import { ServerError } from '../types/types';
import 'dotenv/config';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = 'text-embedding-3-small';

function choicesSystemPrompt(dataset: any) {
  return `You are a decision maker to choose from a list of choices.

  - You will receive a human input regarding a query about human language
  - You will also receive a list of choices that are similar to the user's query
  - The choices that have been selected are similar queries to the user response.
  - But, you need to choose the best answer that fits.
  - Limit yourself to the knowledge within the given choices.

  Dataset choices: ${JSON.stringify(dataset)}
  `;
}

function friendlyReport(dataset: string) {
  return `You are an interpreter to print a text-friendly report.

  Turn the following dataset into a friendly, human-readable translation report.

  - The output will be plain text
  - The screen will be very narrow (50 characters max)
  - Avoid '------' type of lines
  - Height is flexible
  - Use copious carriage returns
  - Use spacious carriage returns and spacing to make a spacious report
  - Please format in a clean/spacious way so that it is easy to read
  - Do not use Markdown
  - Dataset is a language translation

  dataset:

  ${dataset}
  `;
}

async function askAiChoices(
  question: string,
  choices: unknown
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // gpt-4o or gpt-3.5-turbo
    messages: [
      { role: 'system', content: choicesSystemPrompt(choices) },
      { role: 'user', content: question },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from OpenAI');
  return content;
}

async function formatReport(data: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini', // gpt-4o or gpt-3.5-turbo
    messages: [
      { role: 'user', content: friendlyReport(data) },
    ],
  });
  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from OpenAI');
  return content;
}

export const queryAiEmbedding: RequestHandler = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  const { inputQuery } = res.locals;
  if (!inputQuery) {
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
      encoding_format: 'float',
    });
    // console.log('🚀 embedding:',embedding.data?.[0]?.embedding);

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

export const aiCompletion: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!res.locals.inputQuery) {
    const error: ServerError = {
      log: 'aiCompletion: Error: No locals.inputQuery',
      status: 500,
      message: { err: 'An error occurred while querying OpenAI' },
    };
    return next(error);
  }

  // TODO: pineconeQueryResult was originally spec'd to be locals.vectorOptions
  if (!res.locals.pineconeQueryResult) {
    const error: ServerError = {
      log: 'aiCompletion: Error: No locals.pineconeQueryResult',
      status: 500,
      message: { err: 'An error occurred while querying OpenAI' },
    };
    return next(error);
  }

  const choice = await askAiChoices(
    res.locals.inputQuery,
    res.locals.pineconeQueryResult
  );

  res.locals.aiOutput = await formatReport(choice);
  console.log(`queryAi: choice: ${choice}`);

  return next();
};
