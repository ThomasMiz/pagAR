const router = require('express').Router();
const userAuthenticated = require('../middleware');
const entityApi = require('../entityApi');
const database = require('../database');

router.get('/', userAuthenticated, (req, res) => {
    let accounts = [{tx: "jaja xd"}];
    res.send(accounts)
});

module.exports = router;
