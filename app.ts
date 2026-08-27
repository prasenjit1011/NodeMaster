import 'dotenv/config';

import express, {
    Request,
    Response,
    NextFunction
} from 'express';

import {
    MongoClient,
    Db,
    Collection,
    Document
} from 'mongodb';

import {
    S3Client,
    PutObjectCommand
} from '@aws-sdk/client-s3';

import {
    getSignedUrl
} from '@aws-sdk/s3-request-presigner';

if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.clear();
}
console.log('\n\n-: App Started :-');

// =====================================================
// TYPES
// =====================================================

interface CategoryType {
    id: number;
    title: string;
    status: boolean;
    orderBy: number;
}

interface Category {
    _id: string;
    title: string;
    shortDetails: string;
    longDetails: string;
    status: boolean;
    orderBy: number;
    thumbUrl: string;
    bannerUrl: string;
    imageUrls: string[];
    types: CategoryType[];
    updatedAt: number;
    isDeleted: boolean;
}

interface Product {
    _id: string;
    title: string;
    categoryId: string;
    typeId: string;
    shortDetails: string;
    longDetails: string;
    status: boolean;
    orderBy: number;
    price: string;
    stock: string;
    thumbUrl: string;
    bannerUrl: string;
    imageUrls: string[];
    updatedAt: number;
    isDeleted: boolean;
}

interface CategoryFields {
    title: string;
    shortDetails: string;
    longDetails: string;
    status: boolean;
    orderBy: number;
    thumbUrl: string;
    bannerUrl: string;
    imageUrls: string[];
    types: CategoryType[];
    isDeleted: boolean;
}

interface ProductFields {
    title: string;
    categoryId: string;
    typeId: string;
    shortDetails: string;
    longDetails: string;
    status: boolean;
    orderBy: number;
    price: string;
    stock: string;
    thumbUrl: string;
    bannerUrl: string;
    imageUrls: string[];
    isDeleted: boolean;
}

/**
 * Generic collection documents use string IDs.
 *
 * This fixes:
 * TS2769:
 * Type 'string' is not assignable to type 'Condition<ObjectId>'
 */
interface GenericDocument extends Document {
    _id: string;
}

interface CategoryBody extends Partial<CategoryFields> {
    id?: string | number;
    name?: string;
    description?: string;
}

interface ProductBody extends Partial<ProductFields> {
    id?: string | number;
    name?: string;
    description?: string;
}

interface PresignBody {
    entity?: string;
    id?: string | number;
    productId?: string | number;
    categoryId?: string | number;
    kind?: string;
    contentType?: string;
    imageId?: string | number;
}

interface UploadQuery {
    entity?: string;
    id?: string;
    productId?: string;
    categoryId?: string;
    kind?: string;
    contentType?: string;
    imageId?: string;
}

interface GenericQuery {
    since?: string;
    entity?: string;
    id?: string;
    productId?: string;
    categoryId?: string;
    kind?: string;
    imageId?: string;
    contentType?: string;
}

interface AppError extends Error {
    status?: number;
}

interface UploadOwner {
    entity: 'products' | 'categories';
    id: string | null;
}

// =====================================================
// APP CONFIG
// =====================================================

const app = express();

const PORT = Number(process.env.PORT) || 3000;

const MONGODB_URI = process.env.MONGODB_URI;

const MONGODB_DB =
    process.env.MONGODB_DB || 'nutrisoft';

const MONGODB_COLLECTION =
    process.env.MONGODB_COLLECTION || 'nutrisoft';

const CATEGORIES_COLLECTION =
    process.env.MONGODB_CATEGORIES || 'categories';

const PRODUCTS_COLLECTION =
    process.env.MONGODB_PRODUCTS || 'products';

const AWS_REGION =
    process.env.AWS_REGION || 'ap-south-1';

const S3_BUCKET =
    process.env.S3_BUCKET || '';

const CDN_BASE =
    (process.env.CDN_BASE || '').replace(/\/$/, '');

// =====================================================
// ENV VALIDATION
// =====================================================

if (
    !MONGODB_URI &&
    !process.env.AWS_LAMBDA_FUNCTION_NAME
) {
    console.error('Missing MONGODB_URI in .env');
    process.exit(1);
}

// =====================================================
// MONGODB
// =====================================================

const client = new MongoClient(
    MONGODB_URI || ''
);

let db: Db;

let collection:
    Collection<GenericDocument>;

let categories:
    Collection<Category>;

let products:
    Collection<Product>;

// =====================================================
// S3
// =====================================================

const s3: S3Client | null = S3_BUCKET
    ? new S3Client({
        region: AWS_REGION,

        credentials:
            process.env.AWS_ACCESS_KEY_ID
                ? {
                    accessKeyId:
                        process.env.AWS_ACCESS_KEY_ID,

                    secretAccessKey:
                        process.env.AWS_SECRET_ACCESS_KEY || ''
                }
                : undefined,

        requestChecksumCalculation:
            'WHEN_REQUIRED'
    })
    : null;

// =====================================================
// HELPERS
// =====================================================

function categoryId(
    value: unknown
): string | null {

    const text =
        String(value || '').trim();

    return text || null;
}

function asImageBuffer(body: unknown): Buffer {
    if (Buffer.isBuffer(body)) {
        return body;
    }
    if (body instanceof Uint8Array) {
        return Buffer.from(body);
    }
    if (typeof body === 'string' && body.length > 0) {
        const base64 = body.includes(',') ? body.slice(body.indexOf(',') + 1) : body;
        const decoded = Buffer.from(base64, 'base64');
        if (decoded.length > 0) {
            return decoded;
        }
        return Buffer.from(body);
    }
    return Buffer.alloc(0);
}

// =====================================================

function asBoolean(
    value: unknown,
    fallback = true
): boolean {

    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return fallback;
    }

    if (typeof value === 'string') {
        return (
            value !== 'false' &&
            value !== 'inactive' &&
            value !== '0'
        );
    }

    return Boolean(value);
}

// =====================================================

function asTypes(
    value: unknown
): CategoryType[] {

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((type: any): CategoryType => ({
            id:
                Number(type.id) ||
                Date.now(),

            title:
                String(
                    type.title ||
                    type.name ||
                    ''
                ).trim(),

            status:
                asBoolean(
                    type.status,
                    true
                ),

            orderBy:
                Number(type.orderBy) || 0
        }))
        .filter(
            (type: CategoryType) =>
                Boolean(type.title)
        );
}

// =====================================================
// CATEGORY DTO
// =====================================================

function toCategoryDto(
    doc: Partial<Category>
): Category {

    const id =
        doc._id != null
            ? String(doc._id)
            : '';

    return {
        _id: id,

        title:
            doc.title || '',

        shortDetails:
            doc.shortDetails || '',

        longDetails:
            doc.longDetails || '',

        status:
            asBoolean(
                doc.status,
                true
            ),

        orderBy:
            Number(doc.orderBy) || 0,

        thumbUrl:
            doc.thumbUrl || '',

        bannerUrl:
            doc.bannerUrl || '',

        imageUrls:
            Array.isArray(doc.imageUrls)
                ? doc.imageUrls
                : [],

        types:
            asTypes(doc.types),

        updatedAt:
            doc.updatedAt || 0,

        isDeleted:
            Boolean(doc.isDeleted)
    };
}

// =====================================================
// PRODUCT DTO
// =====================================================

function toProductDto(
    doc: Partial<Product>
): Product {

    const id =
        doc._id != null
            ? String(doc._id)
            : '';

    return {
        _id: id,

        title:
            doc.title || '',

        categoryId:
            doc.categoryId != null
                ? String(doc.categoryId)
                : '',

        typeId:
            doc.typeId != null &&
            doc.typeId !== ''
                ? String(doc.typeId)
                : '',

        shortDetails:
            doc.shortDetails || '',

        longDetails:
            doc.longDetails || '',

        status:
            asBoolean(
                doc.status,
                true
            ),

        orderBy:
            Number(doc.orderBy) || 0,

        price:
            String(doc.price || ''),

        stock:
            String(doc.stock || ''),

        thumbUrl:
            doc.thumbUrl || '',

        bannerUrl:
            doc.bannerUrl || '',

        imageUrls:
            Array.isArray(doc.imageUrls)
                ? doc.imageUrls
                : [],

        updatedAt:
            doc.updatedAt || 0,

        isDeleted:
            Boolean(doc.isDeleted)
    };
}

// =====================================================
// S3 PUBLIC URL
// =====================================================

function publicUrlFor(
    key: string
): string {

    if (CDN_BASE) {
        return `${CDN_BASE}/${key}`;
    }

    return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key}`;
}

// =====================================================
// SEED CATEGORIES
// =====================================================

async function seedCategoriesIfEmpty(): Promise<void> {

    const count =
        await categories.countDocuments();

    if (count > 0) {
        return;
    }

    const now =
        Date.now();

    await categories.insertOne({
        _id: String(now),

        title:
            'Electronics',

        shortDetails:
            'Electronic products',

        longDetails:
            '',

        status:
            true,

        orderBy:
            0,

        thumbUrl:
            '',

        bannerUrl:
            '',

        imageUrls:
            [],

        types:
            [],

        updatedAt:
            now,

        isDeleted:
            false
    });

    console.log(
        '-: Default category seeded :-'
    );
}

// =====================================================
// CONNECT MONGODB
// =====================================================

async function connectMongo(): Promise<void> {

    await client.connect();

    db =
        client.db(
            MONGODB_DB
        );

    /**
     * IMPORTANT:
     * GenericDocument has _id: string.
     * This fixes the ObjectId/string TypeScript error.
     */
    collection =
        db.collection<GenericDocument>(
            MONGODB_COLLECTION
        );

    categories =
        db.collection<Category>(
            CATEGORIES_COLLECTION
        );

    products =
        db.collection<Product>(
            PRODUCTS_COLLECTION
        );

    await categories.createIndex({
        updatedAt: 1
    });

    await categories.createIndex({
        isDeleted: 1,
        orderBy: 1
    });

    await products.createIndex({
        updatedAt: 1
    });

    await products.createIndex({
        isDeleted: 1,
        orderBy: 1
    });

    await seedCategoriesIfEmpty();

    console.log(
        `-: MongoDB connected (${MONGODB_DB}.${MONGODB_COLLECTION}, ${CATEGORIES_COLLECTION}, ${PRODUCTS_COLLECTION}) :-`
    );

    if (S3_BUCKET) {

        console.log(
            `-: S3 uploads enabled (${S3_BUCKET}) :-`
        );

    } else {

        console.log(
            '-: S3 uploads disabled (set S3_BUCKET) :-'
        );
    }
}

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    express.json({
        limit: '2mb'
    })
);

app.use(
    (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        res.setHeader(
            'Access-Control-Allow-Origin',
            '*'
        );

        res.setHeader(
            'Access-Control-Allow-Methods',
            'GET,POST,PUT,DELETE,OPTIONS'
        );

        res.setHeader(
            'Access-Control-Allow-Headers',
            'Content-Type'
        );

        if (req.method === 'OPTIONS') {
            return res.sendStatus(204);
        }

        next();
    }
);

// =====================================================
// HOME
// =====================================================

app.get(
    '/',
    (
        req: Request,
        res: Response
    ) => {

        res.json({
            message:
                '-: Welcome :-',

            mongo:
                'connected',

            s3:
                Boolean(S3_BUCKET),

            endpoints: {

                categories:
                    'GET /categories?since=',

                categoryById:
                    'GET /categories/:id',

                upsertCategory:
                    'PUT /categories/:id',

                createCategory:
                    'POST /categories',

                deleteCategory:
                    'DELETE /categories/:id',

                products:
                    'GET /products?since=',

                productById:
                    'GET /products/:id',

                upsertProduct:
                    'PUT /products/:id',

                createProduct:
                    'POST /products',

                deleteProduct:
                    'DELETE /products/:id',

                presignUpload:
                    'POST /uploads/presign',

                upload:
                    'POST /uploads?entity=&id=&kind=&imageId=',

                list:
                    'GET /data',

                byId:
                    'GET /data/:id'
            }
        });
    }
);

// =====================================================
// CATEGORY FIELDS
// =====================================================

function categoryFieldsFromBody(
    body: CategoryBody
): CategoryFields {

    const title =
        String(
            body.title ||
            body.name ||
            ''
        ).trim();

    return {

        title,

        shortDetails:
            String(
                body.shortDetails ||
                body.description ||
                ''
            ).trim(),

        longDetails:
            String(
                body.longDetails ||
                ''
            ).trim(),

        status:
            asBoolean(
                body.status,
                true
            ),

        orderBy:
            Number(body.orderBy) || 0,

        thumbUrl:
            String(
                body.thumbUrl ||
                ''
            ).trim(),

        bannerUrl:
            String(
                body.bannerUrl ||
                ''
            ).trim(),

        imageUrls:
            Array.isArray(
                body.imageUrls
            )
                ? body.imageUrls.filter(
                    Boolean
                ) as string[]
                : [],

        types:
            asTypes(
                body.types
            ),

        isDeleted:
            Boolean(
                body.isDeleted
            )
    };
}

// =====================================================
// GET CATEGORIES
// =====================================================

app.get(
    '/categories',
    async (
        req: Request<
            {},
            {},
            {},
            GenericQuery
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const since =
                Number(
                    req.query.since
                ) || 0;

            const docs =
                await categories
                    .find({
                        updatedAt: {
                            $gt: since
                        }
                    })
                    .sort({
                        updatedAt: 1
                    })
                    .toArray();

            res.json({
                count:
                    docs.length,

                data:
                    docs.map(
                        toCategoryDto
                    )
            });

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// GET CATEGORY BY ID
// =====================================================

app.get(
    '/categories/:id',
    async (
        req: Request<
            { id: string }
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const id =
                categoryId(
                    req.params.id
                );

            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            'Invalid id'
                    });
            }

            const doc =
                await categories.findOne({
                    _id: id
                });

            if (!doc) {

                return res
                    .status(404)
                    .json({
                        message:
                            'Category not found'
                    });
            }

            res.json(
                toCategoryDto(doc)
            );

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// SAVE CATEGORY
// =====================================================

async function saveCategory(
    id: string,
    fields: CategoryFields
): Promise<Category> {

    const now =
        Date.now();

    const doc: Category = {
        _id: id,
        ...fields,
        updatedAt: now
    };

    const existing =
        await categories.findOne({
            _id: id
        });

    if (existing) {

        await categories.updateOne(
            {
                _id: id
            },
            {
                $set: {
                    ...fields,
                    updatedAt: now
                }
            }
        );

    } else {

        await categories.insertOne(
            doc
        );
    }

    return doc;
}

// =====================================================
// CREATE CATEGORY
// =====================================================

app.post(
    '/categories',
    async (
        req: Request<
            {},
            {},
            CategoryBody
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const fields =
                categoryFieldsFromBody(
                    req.body
                );

            if (!fields.title) {

                return res
                    .status(400)
                    .json({
                        message:
                            'title is required'
                    });
            }

            const id =
                categoryId(
                    req.body.id
                ) ||
                String(Date.now());

            const saved =
                await saveCategory(
                    id,
                    fields
                );

            res
                .status(201)
                .json(
                    toCategoryDto(
                        saved
                    )
                );

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// UPDATE CATEGORY
// =====================================================

app.put(
    '/categories/:id',
    async (
        req: Request<
            { id: string },
            {},
            CategoryBody
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const id =
                categoryId(
                    req.params.id
                );

            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            'Invalid id'
                    });
            }

            const fields =
                categoryFieldsFromBody(
                    req.body
                );

            if (
                !fields.title &&
                !fields.isDeleted
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            'title is required'
                    });
            }

            const saved =
                await saveCategory(
                    id,
                    fields
                );

            res.json(
                toCategoryDto(
                    saved
                )
            );

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// DELETE CATEGORY
// =====================================================

app.delete(
    '/categories/:id',
    async (
        req: Request<
            { id: string }
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const id =
                categoryId(
                    req.params.id
                );

            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            'Invalid id'
                    });
            }

            const now =
                Date.now();

            const result =
                await categories.findOneAndUpdate(
                    {
                        _id: id
                    },
                    {
                        $set: {
                            isDeleted: true,
                            updatedAt: now
                        }
                    },
                    {
                        returnDocument:
                            'after',

                        upsert: true
                    }
                );

            res.json(
                toCategoryDto(
                    result ||
                    {
                        _id: id,
                        title: '',
                        shortDetails: '',
                        longDetails: '',
                        status: false,
                        orderBy: 0,
                        thumbUrl: '',
                        bannerUrl: '',
                        imageUrls: [],
                        types: [],
                        updatedAt: now,
                        isDeleted: true
                    }
                )
            );

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// PRODUCT FIELDS
// =====================================================

function productFieldsFromBody(
    body: ProductBody
): ProductFields {

    const title =
        String(
            body.title ||
            body.name ||
            ''
        ).trim();

    return {

        title,

        categoryId:
            String(
                body.categoryId ||
                ''
            ).trim(),

        typeId:
            body.typeId == null ||
            body.typeId === ''
                ? ''
                : String(
                    body.typeId
                ),

        shortDetails:
            String(
                body.shortDetails ||
                body.description ||
                ''
            ).trim(),

        longDetails:
            String(
                body.longDetails ||
                ''
            ).trim(),

        status:
            asBoolean(
                body.status,
                true
            ),

        orderBy:
            Number(
                body.orderBy
            ) || 0,

        price:
            String(
                body.price ||
                ''
            ).trim(),

        stock:
            String(
                body.stock ||
                ''
            ).trim(),

        thumbUrl:
            String(
                body.thumbUrl ||
                ''
            ).trim(),

        bannerUrl:
            String(
                body.bannerUrl ||
                ''
            ).trim(),

        imageUrls:
            Array.isArray(
                body.imageUrls
            )
                ? body.imageUrls.filter(
                    Boolean
                ) as string[]
                : [],

        isDeleted:
            Boolean(
                body.isDeleted
            )
    };
}

// =====================================================
// SAVE PRODUCT
// =====================================================

async function saveProduct(
    id: string,
    fields: ProductFields
): Promise<Product> {

    const now =
        Date.now();

    const doc: Product = {
        _id: id,
        ...fields,
        updatedAt: now
    };

    const existing =
        await products.findOne({
            _id: id
        });

    if (existing) {

        await products.updateOne(
            {
                _id: id
            },
            {
                $set: {
                    ...fields,
                    updatedAt: now
                }
            }
        );

    } else {

        await products.insertOne(
            doc
        );
    }

    return doc;
}

// =====================================================
// GET PRODUCTS
// =====================================================

app.get(
    '/products',
    async (
        req: Request<
            {},
            {},
            {},
            GenericQuery
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const since =
                Number(
                    req.query.since
                ) || 0;

            const docs =
                await products
                    .find({
                        updatedAt: {
                            $gt: since
                        }
                    })
                    .sort({
                        updatedAt: 1
                    })
                    .toArray();

            res.json({
                count:
                    docs.length,

                data:
                    docs.map(
                        toProductDto
                    )
            });

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// GET PRODUCT BY ID
// =====================================================

app.get(
    '/products/:id',
    async (
        req: Request<
            { id: string }
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const id =
                categoryId(
                    req.params.id
                );

            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            'Invalid id'
                    });
            }

            const doc =
                await products.findOne({
                    _id: id
                });

            if (!doc) {

                return res
                    .status(404)
                    .json({
                        message:
                            'Product not found'
                    });
            }

            res.json(
                toProductDto(
                    doc
                )
            );

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// CREATE PRODUCT
// =====================================================

app.post(
    '/products',
    async (
        req: Request<
            {},
            {},
            ProductBody
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const fields =
                productFieldsFromBody(
                    req.body
                );

            if (!fields.title) {

                return res
                    .status(400)
                    .json({
                        message:
                            'title is required'
                    });
            }

            const id =
                categoryId(
                    req.body.id
                ) ||
                String(Date.now());

            const saved =
                await saveProduct(
                    id,
                    fields
                );

            res
                .status(201)
                .json(
                    toProductDto(
                        saved
                    )
                );

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// UPDATE PRODUCT
// =====================================================

app.put(
    '/products/:id',
    async (
        req: Request<
            { id: string },
            {},
            ProductBody
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const id =
                categoryId(
                    req.params.id
                );

            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            'Invalid id'
                    });
            }

            const fields =
                productFieldsFromBody(
                    req.body
                );

            if (
                !fields.title &&
                !fields.isDeleted
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            'title is required'
                    });
            }

            const saved =
                await saveProduct(
                    id,
                    fields
                );

            res.json(
                toProductDto(
                    saved
                )
            );

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// DELETE PRODUCT
// =====================================================

app.delete(
    '/products/:id',
    async (
        req: Request<
            { id: string }
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const id =
                categoryId(
                    req.params.id
                );

            if (!id) {

                return res
                    .status(400)
                    .json({
                        message:
                            'Invalid id'
                    });
            }

            const now =
                Date.now();

            const result =
                await products.findOneAndUpdate(
                    {
                        _id: id
                    },
                    {
                        $set: {
                            isDeleted: true,
                            updatedAt: now
                        }
                    },
                    {
                        returnDocument:
                            'after',

                        upsert: true
                    }
                );

            res.json(
                toProductDto(
                    result ||
                    {
                        _id: id,
                        title: '',
                        categoryId: '',
                        typeId: '',
                        shortDetails: '',
                        longDetails: '',
                        status: false,
                        orderBy: 0,
                        price: '',
                        stock: '',
                        thumbUrl: '',
                        bannerUrl: '',
                        imageUrls: [],
                        updatedAt: now,
                        isDeleted: true
                    }
                )
            );

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// OBJECT KEY
// =====================================================

function objectKeyFor(
    entity:
        | 'products'
        | 'categories',

    ownerId: string,

    kind: string,

    imageId: string
): string {

    const folder =
        entity === 'products'
            ? 'products'
            : 'categories';

    return kind === 'gallery'
        ? `${folder}/${ownerId}/gallery/${imageId}.jpg`
        : `${folder}/${ownerId}/${kind}.jpg`;
}

// =====================================================
// UPLOAD OWNER
// =====================================================

function uploadOwner(
    req: Request<
        {},
        {},
        PresignBody,
        GenericQuery
    >
): UploadOwner {

    const entity =
        String(
            req.query.entity ||
            req.body?.entity ||
            ''
        ).trim()
        ||
        (
            req.query.productId ||
            req.body?.productId
                ? 'products'
                : 'categories'
        );

    const id =
        categoryId(
            req.query.id ||
            req.body?.id ||
            req.query.productId ||
            req.body?.productId ||
            req.query.categoryId ||
            req.body?.categoryId
        );

    return {
        entity:
            entity === 'products'
                ? 'products'
                : 'categories',

        id
    };
}

// =====================================================
// PRESIGNED S3 URL
// =====================================================

app.post(
    '/uploads/presign',
    async (
        req: Request<
            {},
            {},
            PresignBody
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            if (!s3 || !S3_BUCKET) {

                return res
                    .status(503)
                    .json({
                        message:
                            'S3 is not configured'
                    });
            }

            const {
                entity,
                id
            } =
                uploadOwner(
                    req as Request<
                        {},
                        {},
                        PresignBody,
                        GenericQuery
                    >
                );

            const kind =
                String(
                    req.body.kind ||
                    ''
                ).trim();

            const contentType =
                String(
                    req.body.contentType ||
                    'image/jpeg'
                );

            const imageId =
                categoryId(
                    req.body.imageId
                ) ||
                String(Date.now());

            if (
                !id ||
                ![
                    'thumb',
                    'banner',
                    'gallery'
                ].includes(kind)
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            'id (or categoryId/productId) and kind (thumb|banner|gallery) are required'
                    });
            }

            const key =
                objectKeyFor(
                    entity,
                    id,
                    kind,
                    imageId
                );

            const url =
                await getSignedUrl(
                    s3,

                    new PutObjectCommand({
                        Bucket:
                            S3_BUCKET,

                        Key:
                            key,

                        ContentType:
                            contentType,

                        ChecksumAlgorithm:
                            undefined
                    }),

                    {
                        expiresIn:
                            300
                    }
                );

            res.json({

                uploadUrl:
                    url,

                publicUrl:
                    publicUrlFor(key),

                key
            });

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// DIRECT S3 UPLOAD
// =====================================================

app.post(
    '/uploads',

    express.raw({
        type: () => true,
        limit: '15mb'
    }),

    async (
        req: Request<
            {},
            {},
            Buffer,
            UploadQuery
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            if (!s3 || !S3_BUCKET) {

                return res
                    .status(503)
                    .json({
                        message:
                            'S3 is not configured'
                    });
            }

            const entity =
                String(
                    req.query.entity ||
                    ''
                ).trim() === 'products'
                    ? 'products'
                    : 'categories';

            const id =
                categoryId(
                    req.query.id ||
                    req.query.productId ||
                    req.query.categoryId
                );

            const kind =
                String(
                    req.query.kind ||
                    ''
                ).trim();

            const contentType =
                String(
                    req.headers[
                        'content-type'
                    ] ||
                    req.query.contentType ||
                    'image/jpeg'
                );

            const imageId =
                categoryId(
                    req.query.imageId
                ) ||
                String(Date.now());

            if (
                !id ||
                ![
                    'thumb',
                    'banner',
                    'gallery'
                ].includes(kind)
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            'id (or categoryId/productId) and kind (thumb|banner|gallery) are required'
                    });
            }

            const body = asImageBuffer(req.body);

            if (!body.length) {

                return res
                    .status(400)
                    .json({
                        message:
                            'Image body is required'
                    });
            }

            const key =
                objectKeyFor(
                    entity,
                    id,
                    kind,
                    imageId
                );

            await s3.send(
                new PutObjectCommand({
                    Bucket:
                        S3_BUCKET,

                    Key:
                        key,

                    Body:
                        body,

                    ContentType:
                        contentType
                            .split(';')[0]
                            .trim() ||
                        'image/jpeg'
                })
            );

            res
                .status(201)
                .json({

                    publicUrl:
                        publicUrlFor(key),

                    key
                });

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// GENERIC DATA
// =====================================================

app.get(
    '/data',
    async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        try {

            const data =
                await collection
                    .find()
                    .toArray();

            res.json({

                collection:
                    MONGODB_COLLECTION,

                count:
                    data.length,

                data
            });

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// GET GENERIC DATA BY STRING ID
// =====================================================

app.get(
    '/data/:id',
    async (
        req: Request<
            { id: string }
        >,
        res: Response,
        next: NextFunction
    ) => {

        try {

            /**
             * No "as any" required here.
             *
             * collection is Collection<GenericDocument>
             * and GenericDocument._id is string.
             */
            const doc =
                await collection.findOne({
                    _id: req.params.id
                });

            if (!doc) {

                return res
                    .status(404)
                    .json({
                        message:
                            'Document not found'
                    });
            }

            res.json(doc);

        } catch (err) {
            next(err);
        }
    }
);

// =====================================================
// CENTRAL ERROR HANDLER
// =====================================================

app.use(
    (
        err: AppError,
        req: Request,
        res: Response,
        next: NextFunction
    ) => {

        console.error(
            'Central Error Handler:',
            err.message
        );

        res
            .status(500)
            .json({

                message:
                    'Internal Server Error',

                error:
                    err.message
            });
    }
);

// =====================================================
// ENSURE MONGODB
// =====================================================

let mongoReady:
    Promise<void> | undefined;

async function ensureMongo(): Promise<void> {

    if (!MONGODB_URI) {

        throw new Error(
            'Missing MONGODB_URI'
        );
    }

    if (!mongoReady) {

        mongoReady =
            connectMongo();
    }

    return mongoReady;
}

// =====================================================
// START SERVER
// =====================================================

if (
    require.main === module
) {

    ensureMongo()
        .then(() => {

            app.listen(
                PORT,
                '0.0.0.0',
                () => {

                    console.log(
                        `-: App Running on http://localhost:${PORT} :-`
                    );
                }
            );
        })
        .catch(
            (err: Error) => {

                console.error(
                    'MongoDB connection failed:',
                    err.message
                );

                process.exit(1);
            }
        );
}

// =====================================================
// EXPORT
// =====================================================

export {
    app,
    ensureMongo
};

// =====================================================
// GRACEFUL SHUTDOWN
// =====================================================

process.on(
    'SIGINT',
    async () => {

        await client.close();

        process.exit(0);
    }
);