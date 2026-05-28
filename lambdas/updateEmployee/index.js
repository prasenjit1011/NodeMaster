const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URL;

exports.handler = async (event) => {

    const body = JSON.parse(event.body);

    const client = new MongoClient(uri);

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
};