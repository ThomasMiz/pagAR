const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const forms = require('../forms');
const jwt_secret = require('../jwt_secret');
const database = require('../database');

router.post('/register', async (req, res) => {
    const {error} = forms.registerForm(req.body);
    if (error)
        return res.status(400).send(error.details);

    // TODO: Verify CBU exists and belongs to an active account, or create account if no CBU was specified.
    if (!req.body.cbu)
        return res.status(501).send({message: "Server does not support creating CBUs yet"});

    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));

    try {
        await database.createAccount(req.body.alias, hash, req.body.cbu, req.body.firstName, req.body.lastName);
    } catch (e) {
        return res.status(409).send({message: "Alias already taken"});
    }

    try {
        return res.status(201).send({
            alias: req.body.alias,
            cbu: req.body.cbu,
            firstName: req.body.firstName,
            lastName: req.body.lastName
        });
    } catch (error) {
        return res.status(500).send({message: error});
    }
});

router.post('/login', async (req, res) => {
    const {error} = forms.loginForm(req.body);
    if (error)
        return res.status(400).send(error.details);

    const user = await database.getAccount(req.body.alias);
    if (!user || !bcrypt.compareSync(req.body.password, user.password))
        return res.status(400).send("Invalid alias or password");

    const token = jwt.sign({alias: user.alias}, jwt_secret);
    return res.status(200).send({"token": token, "user": {
        alias: user.alias,
        cbu: user.cbu,
        dateJoined: user.dateJoined,
        firstName: user.firstName,
        lastName: user.lastName
    }});
});

module.exports = router;
