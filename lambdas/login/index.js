const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

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

exports.handler = async (event) => {

    try {

        const body = JSON.parse(event.body || '{}');

        if (
            !body.username ||
            !body.password
        ) {

            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'Username and password are required'
                })
            };
        }

        const client = await getMongoClient();

        const db = client.db('demodb');

        const users = db.collection('users');

        // Find user by username only
        const user = await users.findOne({
            username: body.username
        });

        if (!user) {

            return {
                statusCode: 401,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid username or password'
                })
            };
        }

        // Compare hashed password
        const isPasswordValid = await bcrypt.compare(
            body.password,
            user.password
        );

        if (!isPasswordValid) {

            return {
                statusCode: 401,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid username or password'
                })
            };
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Login successful',
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            })
        };

    } catch (error) {

        console.error('Login Error:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: 'Internal server error',
                error: error.message
            })
        };

    }
};