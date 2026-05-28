const {
    S3Client,
    PutObjectCommand
} = require('@aws-sdk/client-s3');

const { MongoClient, ObjectId } = require('mongodb');

const s3 = new S3Client({});

const uri = process.env.MONGO_URI;

const bucketName = process.env.BUCKET_NAME;

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
            : (event.body || {});

        const employeeId = body.employeeId;

        const image = body.image;

        if (!employeeId || !image) {

            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'employeeId and image are required'
                })
            };
        }

        const fileName = `${Date.now()}.jpg`;

        const buffer = Buffer.from(
            image,
            'base64'
        );

        await s3.send(

            new PutObjectCommand({

                Bucket: bucketName,

                Key: `employees/${fileName}`,

                Body: buffer,

                ContentType: 'image/jpeg'

            })
        );

        const imageUrl =
            `https://${bucketName}.s3.amazonaws.com/employees/${fileName}`;

        const client = await getClient();

        const db = client.db('demodb');

        await db.collection('employees').updateOne(

            {
                _id: new ObjectId(employeeId)
            },

            {
                $set: {
                    image: imageUrl
                }
            }
        );

        return {

            statusCode: 200,

            body: JSON.stringify({

                message: 'Employee image uploaded',

                imageUrl
            })
        };

    } catch (error) {

        console.log(error);

        return {

            statusCode: 500,

            body: JSON.stringify({

                message: 'Image upload failed',

                error: error.message
            })
        };
    }
};