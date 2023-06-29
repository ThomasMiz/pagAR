const express = require('express')
const router = express.Router();
const Account = require('../models/Account');

router.get('/', (req, res) => {
    res.send({welcome: "Buenos Días :)"});
});

router.post('/', async (req, res) => {

    try {
        const account =  await Account.create({})
        res.status(200).json(account)
    } catch (e) {
        res.status(400).json({error: e.message})
    }
});

module.exports = router;
