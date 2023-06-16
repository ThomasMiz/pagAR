const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const forms = require('../forms');
const jwt_secret = require('../jwt_secret');

router.post('/register', async (req, res) => {
    const {error} = forms.registerForm(req.body);
    if (error)
        return res.status(400).send(error.details);

    const hash = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));

    // TODO: Create user, if already exists return http error.
    user = {alias: "pedro.mcpedro", cbu: "0010069400000000004200", firstName: "pedro", lastName: "mcpedro"};

    try {
        return res.status(201).send(user);
    } catch (error) {
        return res.status(500).send({message: error});
    }
});

router.post('/login', async (req, res) => {
    const {error} = forms.loginForm(req.body);
    if (error)
        return res.status(400).send(error.details);

    // TODO: Get user from database, if not exists or password doesn't match return http error.
    if (req.body.alias !== "pedro.mcpedro")
        return res.status(400).send("Invalid alias or password");
    user = {alias: "pedro.mcpedro", cbu: "0010069400000000004200", firstName: "pedro", lastName: "mcpedro"};
    userPassword = "$2a$10$BG0e3LvA9Ev2rECxkV7dQOxx3yKojuKUrvDnHJAMvG2SQhfE.TuKy"; // 'pedro1234'

    if (!bcrypt.compareSync(req.body.password, userPassword))
        return res.status(400).send("Invalid alias or password");

    const token = jwt.sign({alias: user.alias}, jwt_secret);
    return res.status(200).send({"token": token, "user": user});
});

module.exports = router;
