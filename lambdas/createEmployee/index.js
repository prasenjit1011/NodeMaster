const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');

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

        //////////////////////////////////////////////////
        // JWT TOKEN VALIDATION
        //////////////////////////////////////////////////

        const authHeader =
            event.headers?.authorization ||
            event.headers?.Authorization;

        if (!authHeader) {

            return {
                statusCode: 401,
                body: JSON.stringify({
                    success: false,
                    message: 'Authorization token missing'
                })
            };
        }

        const token = authHeader.replace(
            'Bearer ',
            ''
        );

        let decoded;

        try {

            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        } catch (error) {

            return {
                statusCode: 401,
                body: JSON.stringify({
                    success: false,
                    message: 'Invalid or expired token'
                })
            };
        }

        //////////////////////////////////////////////////
        // DATABASE CONNECTION
        //////////////////////////////////////////////////

        const client = await getClient();

        const db = client.db('demodb');

        //////////////////////////////////////////////////
        // REQUEST BODY
        //////////////////////////////////////////////////

        const body =
            typeof event.body === 'string'
                ? JSON.parse(event.body)
                : event.body;

        //////////////////////////////////////////////////
        // VALIDATION
        //////////////////////////////////////////////////

        if (
            !body.name ||
            !body.email ||
            !body.mobile ||
            !body.department
        ) {

            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message:
                        'name, email, mobile and department are required'
                })
            };
        }

        //////////////////////////////////////////////////
        // CREATE EMPLOYEE
        //////////////////////////////////////////////////

        const employee = {

            name: body.name,
            email: body.email,
            mobile: body.mobile,
            department: body.department,

            createdBy: decoded.username,

            createdAt: new Date()
        };

        const result = await db
            .collection('employees')
            .insertOne(employee);

        //////////////////////////////////////////////////
        // RESPONSE
        //////////////////////////////////////////////////

        return {
            statusCode: 201,
            body: JSON.stringify({
                success: true,
                message:
                    'Employee created successfully',
                employeeId: result.insertedId
            })
        };

    } catch (error) {

        console.error(
            'Create Employee Error:',
            error
        );

        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                message: error.message
            })
        };
    }
};