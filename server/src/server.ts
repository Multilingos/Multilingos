import express, { ErrorRequestHandler } from 'express';
import { ServerError } from './types/types.js';

//! import middleware here:
import { parseUserQuery } from './controllers/parsers';
// import { queryAiEmbedding, aiCompletion } from ' file path ';
// import { queryVectorDb } from ' file path ';

const app = express();
const PORT = 3000;

//* this will take the plain text input and change it into JSON format
app.use(express.json());

app.post(
  '/api',
  parseUserQuery,
  // queryAiEmbedding
  // queryVectorDb,
  // aiCompletion,
  (_req, res) => {
    res.status(200).json({ response: 'best team ever' });
  }
);

const errorHandler: ErrorRequestHandler = (
  err: ServerError,
  _req,
  res,
  _next
) => {
  const defaultErr: ServerError = {
    log: 'Express error handler caught unknown middleware error',
    status: 500,
    message: { err: 'An error occurred' },
  };
  const errorObj: ServerError = { ...defaultErr, ...err };
  console.log(errorObj.log);
  res.status(errorObj.status).json(errorObj.message);
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
