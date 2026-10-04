const fs = require('fs');
const path = require('path');

const tradebookDir = process.env.AWS_LAMBDA_FUNCTION_NAME
    ? path.join('/tmp', 'tradebook')
    : path.join(__dirname, '..', 'public', 'tradebook');

if (!fs.existsSync(tradebookDir)) {
    fs.mkdirSync(tradebookDir, { recursive: true });
}

module.exports = tradebookDir;
