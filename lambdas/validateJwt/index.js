const jwt = require('jsonwebtoken');

exports.handler = async (event) => {

    try {

        const token = event.headers.Authorization ||
            event.headers.authorization;

        if (!token) {
            throw new Error('Token missing');
        }

        const decoded = jwt.verify(
            token.replace('Bearer ', ''),
            process.env.JWT_SECRET
        );

        return {
            statusCode: 200,
            body: JSON.stringify({
                valid: true,
                user: decoded
            })
        };

    } catch (error) {

        return {
            statusCode: 401,
            body: JSON.stringify({
                valid: false,
                message: error.message
            })
        };
    }
};