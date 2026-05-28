const jwt = require('jsonwebtoken');

exports.handler = async (event) => {

    try {
        const headers = event.headers || event.Payload?.headers || {};
        const token =
            event.headers?.Authorization ||
            event.headers?.authorization ||
            event.token;

        if (!token) {

            return {
                statusCode: 401,
                body: JSON.stringify({
                    message: 'JWT token required'
                })
            };
        }

        const cleanToken = token.replace('Bearer ', '');

        const decoded = jwt.verify(
            cleanToken,
            process.env.JWT_SECRET
        );

        return {
            statusCode: 200,
            user: decoded,
            message: 'JWT Valid'
        };

    } catch (error) {

        return {
            statusCode: 401,
            body: JSON.stringify({
                message: 'Invalid JWT Token'
            })
        };
    }
};