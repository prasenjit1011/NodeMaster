require("dotenv").config();

const express = require("express");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(express.json());

/* -----------------------------
   CONFIG
------------------------------*/
const QDRANT_URL = "http://localhost:6333";
const COLLECTION = "rag";

/* -----------------------------
   EMBEDDING (LEARNING VERSION)
------------------------------*/
function getEmbedding(text) {
  const vector = Array(384).fill(0);

  const clean = text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "");

  for (let i = 0; i < clean.length; i++) {
    vector[i % 384] += clean.charCodeAt(i);
  }

  const norm = Math.sqrt(
    vector.reduce((a, b) => a + b * b, 0)
  ) || 1;

  return vector.map(v => v / norm);
}

/* -----------------------------
   GROQ LLM
------------------------------*/
async function askGroq(prompt) {
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Answer ONLY using the given context. If not enough context, say 'Not enough information'.",
          },
          {
            role: "user",
            content: String(prompt).slice(0, 6000),
          },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.data.choices[0].message.content;
  } catch (err) {
    console.error("🔥 GROQ ERROR:", err.response?.data || err.message);
    return `Error: ${err.response?.data?.error?.message || err.message}`;
  }
}

/* -----------------------------
   CREATE COLLECTION (SAFE RESET)
------------------------------*/
async function createCollection() {
  try {
    await axios.get(`${QDRANT_URL}/collections/${COLLECTION}`);
    console.log("✅ Collection exists");
    return;
  } catch (err) {
    if (err.response?.status !== 404) return;
  }

  await axios.put(`${QDRANT_URL}/collections/${COLLECTION}`, {
    vectors: {
      size: 384,
      distance: "Cosine",
    },
  });

  console.log("✅ Collection created");
}

/* -----------------------------
   INSERT VECTOR
------------------------------*/
async function insertVector(id, vector, payload) {
  await axios.put(
    `${QDRANT_URL}/collections/${COLLECTION}/points`,
    {
      points: [{ id, vector, payload }],
    }
  );
}

/* -----------------------------
   SEARCH VECTOR
------------------------------*/
async function searchVector(vector, limit = 10) {
  const res = await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION}/points/search`,
    {
      vector,
      limit,
      with_payload: true,
    }
  );

  return res.data.result || [];
}

/* -----------------------------
   CHUNKING
------------------------------*/
function chunkText(text, size = 500) {
  const words = text.split(" ");
  const chunks = [];
  let chunk = "";

  for (let w of words) {
    if ((chunk + " " + w).length > size) {
      chunks.push(chunk.trim());
      chunk = w;
    } else {
      chunk += " " + w;
    }
  }

  if (chunk.trim()) chunks.push(chunk.trim());
  return chunks;
}

/* -----------------------------
   HEALTH CHECK (IMPORTANT DEBUG)
------------------------------*/
app.get("/health", async (req, res) => {
  try {
    const r = await axios.get(
      `${QDRANT_URL}/collections/${COLLECTION}`
    );

    res.json({
      status: "ok",
      collection: r.data,
    });
  } catch (err) {
    res.status(500).json({
      error: "Qdrant not reachable",
    });
  }
});

/* -----------------------------
   UPLOAD API
------------------------------*/
app.post("/upload", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text required" });
    }

    const chunks = chunkText(text);

    for (let chunk of chunks) {
      const emb = getEmbedding(chunk);

      console.log("📦 Storing chunk:", chunk);

      await insertVector(uuidv4(), emb, {
        text: chunk,
      });
    }

    res.json({
      message: "Uploaded successfully",
      chunks: chunks.length,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err.message);
    res.status(500).json({ error: "Upload failed" });
  }
});

/* -----------------------------
   ASK API (FIXED RAG)
------------------------------*/
app.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question required" });
    }

    const queryEmb = getEmbedding(question);

    let results = await searchVector(queryEmb, 10);

    console.log("🔎 RAW RESULTS:", results);

    if (!results.length) {
      return res.json({
        answer: "No data found in vector database.",
        sources: [],
      });
    }

    // sort by score (IMPORTANT)
    results.sort((a, b) => b.score - a.score);

    // deduplicate
    const seen = new Set();
    results = results.filter(r => {
      const text = r.payload?.text;
      if (!text) return false;

      if (seen.has(text)) return false;
      seen.add(text);
      return true;
    });

    // top 3 only
    results = results.slice(0, 3);

    const context = results.map(r => r.payload.text).join("\n");

    const prompt = `
Answer ONLY using context below.

Context:
${context}

Question:
${question}
`;

    const answer = await askGroq(prompt);

    res.json({
      answer,
      sources: results.map(r => r.payload.text),
    });

  } catch (err) {
    console.error("ASK ERROR:", err.response?.data || err.message);
    res.status(500).json({ error: "Query failed" });
  }
});

/* -----------------------------
   START SERVER
------------------------------*/
app.listen(3000, async () => {
  console.log("🚀 Server running at http://localhost:3000");

  await createCollection();
});