const router = require('express').Router();
const entityApi = require('../entityApi');
const database = require('../database');
const {aliasRegex} = require('../auth/forms');
const cbuUtils = require('../cbuUtils');

router.get('/', async (req, res) => {
    limit = req.query.limit;
    if (limit) {
        limit = parseInt(limit);
        if (!limit || limit < 1) {
            return res.status(501).send({message: "Limit must be greater than 0"});
        }
    }

    let accounts = await database.getUsers(limit);
    res.send(accounts);
});

router.get('/:cbuOrAlias/', async (req, res) => {
    let cbuOrAlias = req.params.cbuOrAlias;
    if (!cbuOrAlias) {
        return res.status(404).send({message: "Invalid CBU or alias"});
    }

    let account = undefined;
    cbuOrAlias = cbuOrAlias.toString().toLowerCase();
    if (cbuOrAlias[0] >= 'a' && cbuOrAlias[0] <= 'z') {
        if (!cbuOrAlias.match(aliasRegex))
            return res.status(404).send({message: "Invalid alias"});

        account = await database.getUserByAlias(cbuOrAlias);
        if (!account)
            return res.status(404).send({message: "Unknown alias"});
    } else if (cbuOrAlias[0] >= '0' && cbuOrAlias[0] <= '9') {
        if (!cbuOrAlias.match(/^[0-9]{22}$/) || !cbuUtils.isValid(cbuOrAlias))
            return res.status(404).send({message: "Invalid CBU"});

        account = await database.getUserByCbu(cbuOrAlias);
        if (!account)
            return res.status(404).send({message: "Unknown CBU"});
    } else {
        return res.status(404).send({message: "Invalid CBU or alias"});
    }

    res.send(account);
});

module.exports = router;
