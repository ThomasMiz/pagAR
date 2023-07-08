const express = require('express')
const router = express.Router();
const Transaction = require("../models/Transactions")
const validators = require("../validators/validators")
const Account = require("../models/Account");
const cbuUtils = require('../cbuUtils');
const BigDecimal = require("../bigdecimal");

router.get('/', async (req, res) => {
    try {
        const account = await Transaction.find()
        const resTransaction = []

        account.forEach(d => resTransaction.push({
            source: d.source,
            destination: d.destination,
            amount: d.amount,
            date: d.date,
            motive: d.motive,
            tag: d.tag
        }))

        res.status(200).json(resTransaction)
    } catch (e) {
        res.status(400).json({error: e.message})
    }
})

router.post('/', async (req, res) => {
    const {source, destination, amount, motive, tag} = req.body

    try {
        if (!source) {
            throw new Error("Parameter \"source\" missing")
        }

        if (!destination) {
            throw new Error("Parameter \"destination\" missing")
        }

        if (!amount) {
            throw new Error("Parameter \"amount\" missing")
        }

        if (source === destination) {
            throw new Error("Transactions must be between different accounts")
        }

        const amountd = validators.validateTransactionAmount(amount);
        const sourceAccount = await validators.validateCbuAccount(source, true, amountd);
        const destinationAccount = await validators.validateCbuAccount(destination, false, amountd);

        const sourceBalance = new BigDecimal(sourceAccount.balance.toString());
        const destinationBalance = new BigDecimal(destinationAccount.balance.toString());

        await Account.findOneAndUpdate({_id: sourceAccount._id}, {balance: (sourceBalance.subtract(amountd)).toString()});
        await Account.findOneAndUpdate({_id: destinationAccount._id}, {balance: (destinationBalance.add(amountd)).toString()});

        const transaction =  await Transaction.create({
            source: sourceAccount,
            destination: destinationAccount,
            amount: amountd.toString(),
            date: new Date(),
            motive: motive,
            tag: tag,
        });

        res.status(201).json({
            id: transaction._id,
            source: sourceAccount.cbu,
            destination: destinationAccount.cbu,
            amount: transaction.amount,
            date: transaction.date,
            motive: transaction.motive,
            tag: transaction.tag,
        });

    } catch (e) {
        res.status(400).json({error: e.message})
    }
})

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const transaction = await Transaction.find({"_id": id});
        res.status(200).json(transaction);
    }catch (e) {
        res.status(500).json({error: e.message});
    }
})

module.exports = router;
