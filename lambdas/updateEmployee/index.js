const { MongoClient, ObjectId } = require('mongodb');

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
                : event.body;

        const employeeId = body.employeeId;

        const client = await getClient();

        const db = client.db('demodb');

        await db.collection('employees').updateOne(

            {
                _id: new ObjectId(employeeId)
            },

            {
                $set: {

                    name: body.name,

                    email: body.email,

                    mobile: body.mobile,

                    department: body.department,

                    updatedAt: new Date()
                }
            }
        );

        return {

            statusCode: 200,

            body: JSON.stringify({

                message: 'Employee updated successfully'
            })
        };

    } catch (error) {

        console.log(error);

        return {

            statusCode: 500,

            body: JSON.stringify({

                message: 'Failed to update employee'
            })
        };
    }
};