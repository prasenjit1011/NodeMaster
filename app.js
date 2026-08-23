require('dotenv').config();

console.clear();
console.log('\n\n-: App Started :-');

const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'nutrisoft';
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || 'nutrisoft';
const CATEGORIES_COLLECTION = process.env.MONGODB_CATEGORIES || 'categories';

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let db;
let collection;
let categories;

function parseObjectId(id) {
    if (!id || !ObjectId.isValid(id)) {
        return null;
    }
    return new ObjectId(id);
}

function capitalizeFirst(value) {
    const text = String(value || '').trim();
    if (!text) {
        return '';
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function toCategoryDto(doc) {
    return {
        id: doc._id.toString(),
        name: doc.name,
        description: doc.description || '',
        status: doc.status || 'active',
        updatedAt: doc.updatedAt || 0,
        isDeleted: !!doc.isDeleted,
    };
}

async function seedCategoriesIfEmpty() {
    const count = await categories.countDocuments();
    if (count > 0) {
        return;
    }

    const now = Date.now();
    await categories.insertMany([
        { name: 'Electronics', description: 'Electronic products', status: 'active', updatedAt: now, isDeleted: false },
        { name: 'Grocery', description: 'Grocery and food products', status: 'active', updatedAt: now, isDeleted: false },
        { name: 'Clothing', description: 'Clothes and fashion products', status: 'active', updatedAt: now, isDeleted: false },
        { name: 'Books', description: 'Books and educational materials', status: 'active', updatedAt: now, isDeleted: false },
        { name: 'Sports', description: 'Sports and fitness products', status: 'active', updatedAt: now, isDeleted: false },
    ]);
}

async function connectMongo() {
    await client.connect();
    db = client.db(MONGODB_DB);
    collection = db.collection(MONGODB_COLLECTION);
    categories = db.collection(CATEGORIES_COLLECTION);
    await categories.createIndex({ updatedAt: 1 });
    await seedCategoriesIfEmpty();
    console.log(`-: MongoDB connected (${MONGODB_DB}.${MONGODB_COLLECTION}, ${CATEGORIES_COLLECTION}) :-`);
}

app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

app.get('/', (req, res) => {
    res.json({
        message: '-: Welcome :-',
        mongo: 'connected',
        endpoints: {
            categories: 'GET /categories?since=',
            categoryById: 'GET /categories/:id',
            createCategory: 'POST /categories',
            updateCategory: 'PUT /categories/:id',
            deleteCategory: 'DELETE /categories/:id',
            list: 'GET /data',
            byId: 'GET /data/:id',
        },
    });
});

app.get('/categories', async (req, res, next) => {
    try {
        const since = Number(req.query.since) || 0;
        const docs = await categories
            .find({ updatedAt: { $gt: since } })
            .sort({ updatedAt: 1 })
            .toArray();

        res.json({
            count: docs.length,
            data: docs.map(toCategoryDto),
        });
    } catch (err) {
        next(err);
    }
});

app.get('/categories/:id', async (req, res, next) => {
    try {
        const objectId = parseObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ message: 'Invalid id' });
        }

        const doc = await categories.findOne({ _id: objectId });
        if (!doc) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(toCategoryDto(doc));
    } catch (err) {
        next(err);
    }
});

app.post('/categories', async (req, res, next) => {
    try {
        const name = capitalizeFirst(req.body.name);
        if (!name) {
            return res.status(400).json({ message: 'name is required' });
        }

        const now = Date.now();
        const doc = {
            name,
            description: capitalizeFirst(req.body.description),
            status: req.body.status || 'active',
            updatedAt: now,
            isDeleted: false,
        };

        const result = await categories.insertOne(doc);
        doc._id = result.insertedId;
        res.status(201).json(toCategoryDto(doc));
    } catch (err) {
        next(err);
    }
});

app.put('/categories/:id', async (req, res, next) => {
    try {
        const objectId = parseObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ message: 'Invalid id' });
        }

        const updates = { updatedAt: Date.now() };
        if (req.body.name !== undefined) {
            const name = capitalizeFirst(req.body.name);
            if (!name) {
                return res.status(400).json({ message: 'name is required' });
            }
            updates.name = name;
        }
        if (req.body.description !== undefined) {
            updates.description = capitalizeFirst(req.body.description);
        }
        if (req.body.status !== undefined) {
            updates.status = req.body.status;
        }
        if (req.body.isDeleted !== undefined) {
            updates.isDeleted = !!req.body.isDeleted;
        }

        const result = await categories.findOneAndUpdate(
            { _id: objectId },
            { $set: updates },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(toCategoryDto(result));
    } catch (err) {
        next(err);
    }
});

app.delete('/categories/:id', async (req, res, next) => {
    try {
        const objectId = parseObjectId(req.params.id);
        if (!objectId) {
            return res.status(400).json({ message: 'Invalid id' });
        }

        const result = await categories.findOneAndUpdate(
            { _id: objectId },
            { $set: { isDeleted: true, updatedAt: Date.now() } },
            { returnDocument: 'after' }
        );

        if (!result) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(toCategoryDto(result));
    } catch (err) {
        next(err);
    }
});

app.get('/data', async (req, res, next) => {
    try {
        const data = await collection.find().toArray();
        res.json({
            collection: MONGODB_COLLECTION,
            count: data.length,
            data,
        });
    } catch (err) {
        next(err);
    }
});

app.get('/data/:id', async (req, res, next) => {
    try {
        const doc = await collection.findOne({ _id: req.params.id });
        if (!doc) {
            return res.status(404).json({ message: 'Document not found' });
        }
        res.json(doc);
    } catch (err) {
        next(err);
    }
});

app.use((err, req, res, next) => {
    console.error('Central Error Handler:', err.message);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

connectMongo()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`-: App Running on http://localhost:${PORT} :-`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection failed:', err.message);
        process.exit(1);
    });

process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
});
