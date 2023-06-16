const jwt = require('jsonwebtoken');
const jwt_secret = require('./jwt_secret');

function userAuthenticated(req, res, next) {
    const auth_header = req.header('authorization');
    if (!auth_header || auth_header.length < 7 || auth_header.substring(0, 7).toLowerCase() !== 'bearer ')
        return res.status(401).send();

    const token = auth_header.substring(7);
    const verified = jwt.verify(token, jwt_secret)
    if (!verified)
        res.status(401).send({message: "Invalid authorization token"});

    next();
}

module.exports = userAuthenticated;
