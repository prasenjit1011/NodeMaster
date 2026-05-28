const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URL;

exports.handler = async (event) => {

    const body = JSON.parse(event.body);

    const client = new MongoClient(uri);

    await client.connect();

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
        statusCode: 200,
        body: JSON.stringify({
            message: 'Employee created successfully',
            employeeId: result.insertedId
        })
    };
};