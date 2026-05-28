const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');

const s3 = new AWS.S3();

exports.handler = async (event) => {

    try {

        const token = event.headers.Authorization ||
            event.headers.authorization;

        if (!token) {
            throw new Error('JWT token required');
        }

        jwt.verify(
            token.replace('Bearer ', ''),
            process.env.JWT_SECRET
        );

        const body = JSON.parse(event.body);

        const buffer = Buffer.from(
            body.base64Image,
            'base64'
        );

        const fileName = `${Date.now()}.png`;

        await s3.putObject({
            Bucket: process.env.BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: 'image/png'
        }).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Image uploaded successfully',
                fileName
            })
        };

    } catch (error) {

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: error.message
            })
        };
    }
};