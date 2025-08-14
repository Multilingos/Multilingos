import express from 'express';

//! import middleware here:
// import { parseUserQuery } from ' file path ';
// import { queryAiEmbedding, aiCompletion } from ' file path ';
// import { queryVectorDb } from ' file path ';

const app = express();
const PORT=3000

//* this will take the plain text input and change it into JSON format
app.use(express.json());

app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
});

