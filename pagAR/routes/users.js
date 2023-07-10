const router = require('express').Router();
const entityApi = require('../entityApi');
const database = require('../database');
const forms = require('./forms');

router.get('/', async (req, res) => {
    limit = req.query.limit;
    if (limit) {
        limit = parseInt(limit);
        if (!limit || limit < 1) {
            return res.status(501).send({message: "Limit must be greater than 0"});
        }
    }
    let usersRaw = await database.getUsers(limit);
    let users = []

    usersRaw.forEach(u => {
        users.push({
            alias: u.alias,
            cbu: u.cbu,
            dateJoined: u.date_joined,
            firstName: u.first_name,
            lastName: u.last_name
        });
    });

    let promises = [];
    users.forEach(u => {
        promises.push((async () => {
            const acc = await entityApi.getAccountByCbu(u.cbu);
            u.balance = acc.balance;
            u.active = acc.active;
        })());
    });
    await Promise.all(promises);
    res.send(users);
});

router.get('/:cbuOrAlias/', async (req, res) => {
    const {error, value} = forms.cbuOrAliasForm(req.params)
    let cbuOrAlias = value.cbuOrAlias;
    if (error)
        return res.status(404).send({message: "Invalid CBU or alias"});

    let user = undefined;
    if (cbuOrAlias[0] >= 'a' && cbuOrAlias[0] <= 'z') {
        user = await database.getUserByAlias(cbuOrAlias);
        if (!user)
            return res.status(404).send({message: "Unknown alias"});
    } else if (cbuOrAlias[0] >= '0' && cbuOrAlias[0] <= '9') {
        user = await database.getUserByCbu(cbuOrAlias);
        if (!user)
            return res.status(404).send({message: "Unknown CBU"});
    } else {
        return res.status(404).send({message: "Invalid CBU or alias"});
    }

    const acc = await entityApi.getAccountByCbu(user.cbu);

    res.status(200).json({
        alias: user.alias,
        cbu: user.cbu,
        dateJoined: user.dateJoined,
        firstName: user.firstName,
        lastName: user.lastName,
        balance: acc.balance,
        active: acc.active
    });
});

module.exports = router;
