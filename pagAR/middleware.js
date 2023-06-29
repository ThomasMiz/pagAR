const jwt = require('jsonwebtoken');
const jwtSecret = require('./jwtSecret');

function userAuthenticated(req, res, next) {
    const authHeader = req.header('authorization');
    if (!authHeader || authHeader.length < 7 || authHeader.substring(0, 7).toLowerCase() !== 'bearer ')
        return res.status(401).send();

    const token = authHeader.substring(7);
    const verified = jwt.verify(token, jwtSecret);
    if (!verified)
        res.status(401).send({message: "Invalid authorization token"});
    else
        req.user = verified;

    return next();
}

module.exports = userAuthenticated;
