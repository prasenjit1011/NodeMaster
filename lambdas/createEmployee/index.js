const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI;

let cachedClient = null;

async function getClient() {

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

        const client = await getClient();

        const db = client.db('demodb');

        const body =
            typeof event.body === 'string'
                ? JSON.parse(event.body)
                : event.body;

        const employee = {

            name: body.name,
            email: body.email,
            mobile: body.mobile,
            department: body.department,

            createdBy:
                event.user?.username || 'system',

            createdAt: new Date()
        };

        const result = await db
            .collection('employees')
            .insertOne(employee);

        return {
            success: true,
            employeeId: result.insertedId
        };

    } catch (error) {

        console.error(error);

        throw error;
    }
};