const router = require('express').Router();
const userAuthenticated = require('../middleware');
const entityApi = require('../entityApi');
const database = require('../database');
const forms = require('./forms');

router.get('/involving/:cbuOrAlias/', async (req, res) => {
    let paramsForm = forms.cbuOrAliasForm(req.params);
    if (paramsForm.error)
        return res.status(404).send({message: "Invalid CBU or alias"});

    let txForm = forms.getTransactionsForm(req.query);
    if (txForm.error)
        return res.status(400).send(txForm.error.details);

    let cbu = undefined;
    if (paramsForm.value.cbuOrAlias[0] >= 'a' && paramsForm.value.cbuOrAlias[0] <= 'z') {
        const user = await database.getUserByAlias(paramsForm.value.cbuOrAlias);
        if (!user)
            return res.status(404).send({message: "Unknown alias"});

        cbu = user.cbu;
    } else {
        cbu = paramsForm.value.cbuOrAlias;
    }

    const transactions = await entityApi.getTransactionsInvolving(txForm.value.page, txForm.value.size, cbu, txForm.value.start, txForm.value.end);
    res.send(transactions);
});

router.get('/:id/', async (req, res) => {
    const id = req.params.id.toString();
    if (!id)
        return res.status(404).send({message: "Invalid transaction id"});

    try {
        console.log(req.params.id, id)
        const transaction = await entityApi.getTransactionById(id);
        return res.status(200).send(transaction);
    } catch {
        return res.status(404).send({message: "Transaction not found"});
    }
});

router.post('/', userAuthenticated, async (req, res) => {
    const {error, value} = forms.createTransactionForm(req.body);
    if (error)
        return res.status(400).send(error.details);

    const sourceUser = await database.getUserByAlias(req.user.alias);
    const sourceCbu = sourceUser.cbu;
    let destinationCbu = undefined;

    if (value.destination[0] >= 'a' && value.destination[0] <= 'z') {
        const user = await database.getUserByAlias(value.destination);
        if (!user)
            return res.status(404).send({message: "Unknown destination alias"});

        destinationCbu = user.cbu;
    } else {
        destinationCbu = value.destination;
    }

    try {
        const tx = await entityApi.createTransaction(sourceCbu, destinationCbu, value.amount, value.motive);
    res.send(tx);
    } catch (error) {
        return res.status(error.response.status).send(error.response.data);
    }
});

module.exports = router;
