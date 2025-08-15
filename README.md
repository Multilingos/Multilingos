# Multilingo

A personalized Language Learning translation app.

### Developer Setup

### Environment variables and Setup

1. `cd server`
2. `npm install` 
3. Create a Pinecone Account
4. Create a new Pinecone index:
   * Index name: `translator`
   * text-embedding-3-small
   * Remember to change Dimension from 512 to 1,536
5. Create an OpenAI Account
6. Add funding to the account: https://platform.openai.com/settings/organization/api-keys
7. Create a `.env` file (Remember we are in `server` directory)
```
PINECONE_API_KEY='<Create and put Pinecone key here>'
OPENAI_API_KEY='<Create and put OpenAI key here>'
PINECONE_INDEX='translator'
```
8. Download `upsertTranslator.js` [data file](https://drive.google.com/file/d/1akhZ4HwmcEsyEKmKB-7JxldgcAiVmE8c/view?usp=sharing)
9. Place `upsertTranslator.js` in the `server` directory
10. `npm run upsertTranslator`


### Run server

```
$ npm run dev

> multilingo@0.0.0 dev
> concurrently -n 'FRONTEND,BACKEND' -c 'cyan,magenta' 'npm run start:frontend' 'cd server; npm run express'

[BACKEND] 
[BACKEND] > server@1.0.0 express
[BACKEND] > nodemon --watch src --ext ts,json --exec "ts-node src/server.ts"
[BACKEND] 
[FRONTEND] 
[FRONTEND] > multilingo@0.0.0 start:frontend
[FRONTEND] > vite
[FRONTEND] 
[BACKEND] [nodemon] 3.1.10
[BACKEND] [nodemon] to restart at any time, enter `rs`
[BACKEND] [nodemon] watching path(s): src/**/*
[BACKEND] [nodemon] watching extensions: ts,json
[BACKEND] [nodemon] starting `ts-node src/server.ts`
[FRONTEND] 
[FRONTEND]   VITE v7.1.2  ready in 137 ms
[FRONTEND] 
[FRONTEND]   ➜  Local:   http://localhost:5173/
[FRONTEND]   ➜  Network: use --host to expose
[BACKEND] Server running on http://localhost:3000
```

