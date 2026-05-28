const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URI;

let cachedClient = null;

async function getMongoClient() {

    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(uri);

    await client.connect();

    cachedClient = client;

    return client;
}

exports.handler = async () => {

    try {

        const client = await getMongoClient();

        const db = client.db('demodb');

        const users = db.collection('users');

        // Create unique index for username
        await users.createIndex(
            { username: 1 },
            { unique: true }
        );

        const existingAdmin = await users.findOne({
            username: 'admin'
        });

        if (existingAdmin) {

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'Admin already exists'
                })
            };
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            'admin123',
            10
        );

        const result = await users.insertOne({
            username: 'admin',
            password: hashedPassword,
            role: 'ADMIN',
            status: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Admin user seeded successfully',
                userId: result.insertedId,
                username: 'admin'
            })
        };

    } catch (error) {

        console.error('Seed Admin Error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Failed to seed admin user',
                error: error.message
            })
        };

    }
};