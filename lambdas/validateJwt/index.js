const jwt = require('jsonwebtoken');

exports.handler = async (event) => {

    try {

        const headers =
            event.headers || {};

        const token =
            headers.Authorization ||
            headers.authorization;

        if (!token) {
            throw new Error('Token missing');
        }

        const decoded = jwt.verify(
            token.replace('Bearer ', ''),
            process.env.JWT_SECRET
        );

        return {
            success: true,
            user: decoded
        };

    } catch (error) {

        throw new Error(
            `Unauthorized: ${error.message}`
        );
    }
};