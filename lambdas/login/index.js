const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;

exports.handler = async (event) => {

    const body = JSON.parse(event.body);

    const client = new MongoClient(uri);

    await client.connect();

    const db = client.db('demodb');

    const user = await db.collection('users').findOne({
        username: body.username,
        password: body.password
    });

    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({
                message: 'Invalid credentials'
            })
        };
    }

    const token = jwt.sign(
        {
            username: user.username
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );

    return {
        statusCode: 200,
        body: JSON.stringify({
            token
        })
    };
};