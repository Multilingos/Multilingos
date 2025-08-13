import express from 'express';

// import { ServerError } from '../src/types/types.ts';

//! import middleware here:
// import { parseUserQuery } from ' file path ';
// import { queryAiEmbedding, aiCompletion } from ' file path ';
// import { queryVectorDb } from ' file path ';


const app = express();
const PORT=3000

//* this will take the plain text input and change it into JSON format
// app.use(express.json());


// app.post('/api', 
//   // parseUserQuery,
//   // queryAiEmbedding,
//   // queryVectorDb,
//   // aiCompletion,
//   (req, res) => {
//     res.locals.aiOutput = 'hey aaron';
//   res.status(200).json({ response: res.locals.aiOutput });
// });

// //* Global error handler
// const errorHandler: ErrorRequestHandler = (
//   err: ServerError,
//   _req,
//   res,
//   _next
// ) => {
//   const defaultErr: ServerError = {
//     log: '❌ Express error handler caught unknown middleware error',
//     status: 500,
//     message: { err: 'An error occurred' },
//   };
//   const errorObj: ServerError = { ...defaultErr, ...err };
//   res.status(errorObj.status).json(errorObj.message);
// };

// app.use(errorHandler);

app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
});

