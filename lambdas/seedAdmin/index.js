const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;

exports.handler = async () => {

    const client = new MongoClient(uri);

    try {

        await client.connect();

        const db = client.db('demodb');

        const users = db.collection('users');

        const existingAdmin = await users.findOne({
            username: 'admin'
        });

        if (existingAdmin) {

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Admin already exists'
                })
            };
        }

        await users.insertOne({
            username: 'admin',
            password: 'admin123',
            role: 'ADMIN',
            createdAt: new Date()
        });

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Admin user seeded successfully',
                username: 'admin',
                password: 'admin123'
            })
        };

    } catch (error) {

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };

    } finally {

        await client.close();
    }
};
