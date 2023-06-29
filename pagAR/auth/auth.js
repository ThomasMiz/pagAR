const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const forms = require('./forms');
const jwtSecret = require('../jwtSecret');
const database = require('../database');
const entityApi = require('../entityApi')

router.post('/register', async (req, res) => {
    const {error} = forms.registerForm(req.body);
    if (error)
        return res.status(400).send(error.details);

    // Verify CBU exists and belongs to an active account, or create account if no CBU was specified.
    let cbu = req.body.cbu;
    if (cbu) {
        try {
            const existingUser = await database.getUserByCbu(cbu);
            if (existingUser)
                return res.status(400).send({message: "An account with said CBU already exists"});
        } catch (error) {
            return res.status(500).send({message: "Try again later"});
        }

        try {
            existingAccount = await entityApi.getAccountByCbu(cbu);
            if (!existingAccount)
                throw 'No such account';
        } catch (error) {
            return res.status(400).send({message: "Couldn't find an account with CBU " + cbu});
        }
    } else {
        newAccount = await entityApi.createAccount();
        cbu = newAccount.cbu;

        if (!cbu) {
            return res.status(501).send({message: "Error creating account, try again later"});
        }
    }


    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));

    try {
        await database.createUser(req.body.alias, hash, cbu, req.body.firstName, req.body.lastName);
    } catch (e) {
        return res.status(409).send({message: "Alias already taken"});
    }

    try {
        return res.status(201).send({
            alias: req.body.alias,
            cbu: cbu,
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

    const user = await database.getUserByAlias(req.body.alias);
    if (!user || !bcrypt.compareSync(req.body.password, user.password))
        return res.status(400).send("Invalid alias or password");

    const token = jwt.sign({alias: user.alias}, jwtSecret);
    return res.status(200).send({"token": token, "user": {
        alias: user.alias,
        cbu: user.cbu,
        dateJoined: user.dateJoined,
        firstName: user.firstName,
        lastName: user.lastName
    }});
});

module.exports = router;
