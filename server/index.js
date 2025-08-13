
import express from 'express';

const app = express();

const PORT=3000


app.get('/api/hello', (req, res) => {
  res.json({message: "allo Tweety"});
});

app.listen(PORT, () => {
   console.log(`Server running on http://localhost:${PORT}`);
});
