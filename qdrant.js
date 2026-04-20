const axios = require("axios");

const QDRANT_URL = "http://localhost:6333";
const COLLECTION_NAME = "rag";

/* -----------------------------
   CREATE COLLECTION (SAFE)
------------------------------*/
async function createCollection() {
  try {
    // Check if collection exists
    const res = await axios.get(
      `${QDRANT_URL}/collections/${COLLECTION_NAME}`
    );

    if (res.data?.result) {
      console.log("✅ Collection already exists");
      return;
    }
  } catch (err) {
    // If not found → create it
    if (err.response?.status !== 404) {
      console.error("Error checking collection:", err.message);
      throw err;
    }
  }

  // Create collection
  try {
    await axios.put(`${QDRANT_URL}/collections/${COLLECTION_NAME}`, {
      vectors: {
        size: 384, // must match your embedding model
        distance: "Cosine",
      },
    });

    console.log("✅ Collection created");
  } catch (err) {
    console.error("Create collection error:", err.message);
  }
}

/* -----------------------------
   INSERT VECTOR
------------------------------*/
async function insertVector(id, vector, payload) {
  await axios.put(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points`,
    {
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    }
  );
}

/* -----------------------------
   SEARCH VECTOR
------------------------------*/
async function searchVector(vector, limit = 5) {
  const res = await axios.post(
    `${QDRANT_URL}/collections/${COLLECTION_NAME}/points/search`,
    {
      vector,
      limit,
      with_payload: true,
    }
  );

  return res.data.result;
}

module.exports = {
  createCollection,
  insertVector,
  searchVector,
};