const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI;

exports.handler = async (event) => {

    let client;

    try {

        const body = JSON.parse(event.body || '{}');

        client = new MongoClient(uri);

        await client.connect();

        const db = client.db('demodb');

        await db.collection('employees').updateOne(
            {
                _id: new ObjectId(body.id)
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
                success: true,
                message: 'Employee updated successfully'
            })
        };

    } catch (error) {

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };

    } finally {

        if (client) {
            await client.close();
        }
    }
};