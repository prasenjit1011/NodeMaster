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
        const body =
        typeof event.body === 'string'
            ? JSON.parse(event.body)
            : (event.body || event);

        const client = await getClient();

        const db = client.db('demodb');

        const employee = {

            name: body.name,

            email: body.email,

            mobile: body.mobile,

            department: body.department,

            createdAt: new Date()
        };

        const result = await db
            .collection('employees')
            .insertOne(employee);

        return {

            statusCode: 201,

            body: JSON.stringify({

                message: 'Employee created successfully',

                employeeId: result.insertedId
            })
        };

    } catch (error) {

        console.log(error);

        return {

            statusCode: 500,

            body: JSON.stringify({

                message: 'Failed to create employee'
            })
        };
    }
};