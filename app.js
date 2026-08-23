require('dotenv').config();

console.clear();
console.log('\n\n-: App Started :-');

const express = require('express');
const { MongoClient } = require('mongodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const app = express();
const PORT = process.env.PORT || 3000;

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'nutrisoft';
const MONGODB_COLLECTION = process.env.MONGODB_COLLECTION || 'nutrisoft';
const CATEGORIES_COLLECTION = process.env.MONGODB_CATEGORIES || 'categories';
const PRODUCTS_COLLECTION = process.env.MONGODB_PRODUCTS || 'products';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const S3_BUCKET = process.env.S3_BUCKET || '';
const CDN_BASE = (process.env.CDN_BASE || '').replace(/\/$/, '');

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
const s3 = S3_BUCKET
    ? new S3Client({
        region: AWS_REGION,
        credentials: process.env.AWS_ACCESS_KEY_ID
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            }
            : undefined,
        requestChecksumCalculation: 'WHEN_REQUIRED',
    })
    : null;

let db;
let collection;
let categories;
let products;

function categoryId(value) {
    const text = String(value || '').trim();
    return text || null;
}

function asBoolean(value, fallback = true) {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }
    if (typeof value === 'string') {
        return value !== 'false' && value !== 'inactive' && value !== '0';
    }
    return !!value;
}

function asTypes(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((type) => ({
            id: Number(type.id) || Date.now(),
            title: String(type.title || type.name || '').trim(),
            status: asBoolean(type.status, true),
            orderBy: Number(type.orderBy) || 0,
        }))
        .filter((type) => type.title);
}

function toCategoryDto(doc) {
    const id = doc._id != null ? String(doc._id) : '';
    return {
        id,
        title: doc.title || doc.name || '',
        shortDetails: doc.shortDetails || doc.description || '',
        longDetails: doc.longDetails || '',
        status: asBoolean(doc.status, true),
        orderBy: Number(doc.orderBy) || 0,
        thumbUrl: doc.thumbUrl || '',
        bannerUrl: doc.bannerUrl || '',
        imageUrls: Array.isArray(doc.imageUrls) ? doc.imageUrls : [],
        types: asTypes(doc.types),
        updatedAt: doc.updatedAt || 0,
        isDeleted: !!doc.isDeleted,
    };
}

function publicUrlFor(key) {
    if (CDN_BASE) {
        return `${CDN_BASE}/${key}`;
    }
    return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

async function seedCategoriesIfEmpty() {
    const count = await categories.countDocuments();
    if (count > 0) {
        return;
    }

    const now = Date.now();
    await categories.insertMany([
        {
            _id: String(now),
            title: 'Electronics',
            shortDetails: 'Electronic products',
            longDetails: '',
            status: true,
            orderBy: 0,
            thumbUrl: '',
            bannerUrl: '',
            imageUrls: [],
            types: [],
            updatedAt: now,
            isDeleted: false,
        },
    ]);
}

async function connectMongo() {
    await client.connect();
    db = client.db(MONGODB_DB);
    collection = db.collection(MONGODB_COLLECTION);
    categories = db.collection(CATEGORIES_COLLECTION);
    products = db.collection(PRODUCTS_COLLECTION);
    await categories.createIndex({ updatedAt: 1 });
    await categories.createIndex({ isDeleted: 1, orderBy: 1 });
    await products.createIndex({ updatedAt: 1 });
    await products.createIndex({ isDeleted: 1, orderBy: 1 });
    await seedCategoriesIfEmpty();
    console.log(`-: MongoDB connected (${MONGODB_DB}.${MONGODB_COLLECTION}, ${CATEGORIES_COLLECTION}, ${PRODUCTS_COLLECTION}) :-`);
    if (S3_BUCKET) {
        console.log(`-: S3 uploads enabled (${S3_BUCKET}) :-`);
    } else {
        console.log('-: S3 uploads disabled (set S3_BUCKET) :-');
    }
}

app.use(express.json({ limit: '2mb' }));
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
        s3: Boolean(S3_BUCKET),
        endpoints: {
            categories: 'GET /categories?since=',
            categoryById: 'GET /categories/:id',
            upsertCategory: 'PUT /categories/:id',
            createCategory: 'POST /categories',
            deleteCategory: 'DELETE /categories/:id',
            products: 'GET /products?since=',
            upsertProduct: 'PUT /products/:id',
            createProduct: 'POST /products',
            deleteProduct: 'DELETE /products/:id',
            presignUpload: 'POST /uploads/presign',
            upload: 'POST /uploads?entity=&id=&kind=&imageId=',
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
        const id = categoryId(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Invalid id' });
        }

        const doc = await categories.findOne({ _id: id });
        if (!doc) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(toCategoryDto(doc));
    } catch (err) {
        next(err);
    }
});

async function saveCategory(id, fields) {
    const now = Date.now();
    const doc = {
        ...fields,
        updatedAt: now,
    };
    const existing = await categories.findOne({ _id: id });
    if (existing) {
        await categories.updateOne({ _id: id }, { $set: doc });
    } else {
        await categories.insertOne({ _id: id, ...doc });
    }
    return { _id: id, ...doc };
}

function objectKeyFor(entity, ownerId, kind, imageId) {
    const folder = entity === 'products' ? 'products' : 'categories';
    return kind === 'gallery'
        ? `${folder}/${ownerId}/gallery/${imageId}.jpg`
        : `${folder}/${ownerId}/${kind}.jpg`;
}

function uploadOwner(req) {
    const entity = String(req.query.entity || req.body?.entity || '').trim()
        || (req.query.productId || req.body?.productId ? 'products' : 'categories');
    const id = categoryId(
        req.query.id
        || req.body?.id
        || req.query.productId
        || req.body?.productId
        || req.query.categoryId
        || req.body?.categoryId
    );
    return { entity: entity === 'products' ? 'products' : 'categories', id };
}

function categoryFieldsFromBody(body) {
    const title = String(body.title || body.name || '').trim();
    return {
        title,
        shortDetails: String(body.shortDetails || body.description || '').trim(),
        longDetails: String(body.longDetails || '').trim(),
        status: asBoolean(body.status, true),
        orderBy: Number(body.orderBy) || 0,
        thumbUrl: String(body.thumbUrl || '').trim(),
        bannerUrl: String(body.bannerUrl || '').trim(),
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.filter(Boolean) : [],
        types: asTypes(body.types),
        isDeleted: !!body.isDeleted,
    };
}

app.post('/categories', async (req, res, next) => {
    try {
        const fields = categoryFieldsFromBody(req.body);
        if (!fields.title) {
            return res.status(400).json({ message: 'title is required' });
        }

        const id = categoryId(req.body.id) || String(Date.now());
        const saved = await saveCategory(id, fields);
        res.status(201).json(toCategoryDto(saved));
    } catch (err) {
        next(err);
    }
});

app.put('/categories/:id', async (req, res, next) => {
    try {
        const id = categoryId(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Invalid id' });
        }

        const fields = categoryFieldsFromBody(req.body);
        if (!fields.title && !fields.isDeleted) {
            return res.status(400).json({ message: 'title is required' });
        }

        const saved = await saveCategory(id, fields);
        res.json(toCategoryDto(saved));
    } catch (err) {
        next(err);
    }
});

app.delete('/categories/:id', async (req, res, next) => {
    try {
        const id = categoryId(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Invalid id' });
        }

        const now = Date.now();
        const result = await categories.findOneAndUpdate(
            { _id: id },
            { $set: { isDeleted: true, updatedAt: now } },
            { returnDocument: 'after', upsert: true }
        );

        res.json(toCategoryDto(result || { _id: id, isDeleted: true, updatedAt: now, title: '' }));
    } catch (err) {
        next(err);
    }
});

function toProductDto(doc) {
    const id = doc._id != null ? String(doc._id) : '';
    return {
        id,
        title: doc.title || doc.name || '',
        categoryId: doc.categoryId != null ? String(doc.categoryId) : '',
        typeId: doc.typeId != null && doc.typeId !== '' ? String(doc.typeId) : '',
        shortDetails: doc.shortDetails || doc.description || '',
        longDetails: doc.longDetails || '',
        status: asBoolean(doc.status, true),
        orderBy: Number(doc.orderBy) || 0,
        price: String(doc.price || ''),
        stock: String(doc.stock || ''),
        thumbUrl: doc.thumbUrl || '',
        bannerUrl: doc.bannerUrl || '',
        imageUrls: Array.isArray(doc.imageUrls) ? doc.imageUrls : [],
        updatedAt: doc.updatedAt || 0,
        isDeleted: !!doc.isDeleted,
    };
}

function productFieldsFromBody(body) {
    const title = String(body.title || body.name || '').trim();
    return {
        title,
        categoryId: String(body.categoryId || '').trim(),
        typeId: body.typeId == null || body.typeId === '' ? '' : String(body.typeId),
        shortDetails: String(body.shortDetails || body.description || '').trim(),
        longDetails: String(body.longDetails || '').trim(),
        status: asBoolean(body.status, true),
        orderBy: Number(body.orderBy) || 0,
        price: String(body.price || '').trim(),
        stock: String(body.stock || '').trim(),
        thumbUrl: String(body.thumbUrl || '').trim(),
        bannerUrl: String(body.bannerUrl || '').trim(),
        imageUrls: Array.isArray(body.imageUrls) ? body.imageUrls.filter(Boolean) : [],
        isDeleted: !!body.isDeleted,
    };
}

async function saveProduct(id, fields) {
    const now = Date.now();
    const doc = {
        ...fields,
        updatedAt: now,
    };
    const existing = await products.findOne({ _id: id });
    if (existing) {
        await products.updateOne({ _id: id }, { $set: doc });
    } else {
        await products.insertOne({ _id: id, ...doc });
    }
    return { _id: id, ...doc };
}

app.get('/products', async (req, res, next) => {
    try {
        const since = Number(req.query.since) || 0;
        const docs = await products
            .find({ updatedAt: { $gt: since } })
            .sort({ updatedAt: 1 })
            .toArray();

        res.json({
            count: docs.length,
            data: docs.map(toProductDto),
        });
    } catch (err) {
        next(err);
    }
});

app.get('/products/:id', async (req, res, next) => {
    try {
        const id = categoryId(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Invalid id' });
        }
        const doc = await products.findOne({ _id: id });
        if (!doc) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(toProductDto(doc));
    } catch (err) {
        next(err);
    }
});

app.post('/products', async (req, res, next) => {
    try {
        const fields = productFieldsFromBody(req.body);
        if (!fields.title) {
            return res.status(400).json({ message: 'title is required' });
        }
        const id = categoryId(req.body.id) || String(Date.now());
        const saved = await saveProduct(id, fields);
        res.status(201).json(toProductDto(saved));
    } catch (err) {
        next(err);
    }
});

app.put('/products/:id', async (req, res, next) => {
    try {
        const id = categoryId(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Invalid id' });
        }
        const fields = productFieldsFromBody(req.body);
        if (!fields.title && !fields.isDeleted) {
            return res.status(400).json({ message: 'title is required' });
        }
        const saved = await saveProduct(id, fields);
        res.json(toProductDto(saved));
    } catch (err) {
        next(err);
    }
});

app.delete('/products/:id', async (req, res, next) => {
    try {
        const id = categoryId(req.params.id);
        if (!id) {
            return res.status(400).json({ message: 'Invalid id' });
        }
        const now = Date.now();
        const result = await products.findOneAndUpdate(
            { _id: id },
            { $set: { isDeleted: true, updatedAt: now } },
            { returnDocument: 'after', upsert: true }
        );
        res.json(toProductDto(result || { _id: id, isDeleted: true, updatedAt: now, title: '' }));
    } catch (err) {
        next(err);
    }
});

app.post('/uploads/presign', async (req, res, next) => {
    try {
        if (!s3 || !S3_BUCKET) {
            return res.status(503).json({ message: 'S3 is not configured' });
        }

        const { entity, id } = uploadOwner(req);
        const kind = String(req.body.kind || '').trim();
        const contentType = String(req.body.contentType || 'image/jpeg');
        const imageId = categoryId(req.body.imageId) || String(Date.now());

        if (!id || !['thumb', 'banner', 'gallery'].includes(kind)) {
            return res.status(400).json({ message: 'id (or categoryId/productId) and kind (thumb|banner|gallery) are required' });
        }

        const key = objectKeyFor(entity, id, kind, imageId);

        const url = await getSignedUrl(
            s3,
            new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: key,
                ContentType: contentType,
                ChecksumAlgorithm: undefined,
            }),
            { expiresIn: 300 }
        );

        res.json({
            uploadUrl: url,
            publicUrl: publicUrlFor(key),
            key,
        });
    } catch (err) {
        next(err);
    }
});

app.post(
    '/uploads',
    express.raw({ type: () => true, limit: '15mb' }),
    async (req, res, next) => {
        try {
            if (!s3 || !S3_BUCKET) {
                return res.status(503).json({ message: 'S3 is not configured' });
            }

            const entity = String(req.query.entity || '').trim() === 'products' ? 'products' : 'categories';
            const id = categoryId(req.query.id || req.query.productId || req.query.categoryId);
            const kind = String(req.query.kind || '').trim();
            const contentType = String(req.headers['content-type'] || req.query.contentType || 'image/jpeg');
            const imageId = categoryId(req.query.imageId) || String(Date.now());

            if (!id || !['thumb', 'banner', 'gallery'].includes(kind)) {
                return res.status(400).json({ message: 'id (or categoryId/productId) and kind (thumb|banner|gallery) are required' });
            }

            const body = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
            if (!body.length) {
                return res.status(400).json({ message: 'Image body is required' });
            }

            const key = objectKeyFor(entity, id, kind, imageId);
            await s3.send(
                new PutObjectCommand({
                    Bucket: S3_BUCKET,
                    Key: key,
                    Body: body,
                    ContentType: contentType.split(';')[0].trim() || 'image/jpeg',
                })
            );

            res.status(201).json({
                publicUrl: publicUrlFor(key),
                key,
            });
        } catch (err) {
            next(err);
        }
    }
);

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
