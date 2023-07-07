const express = require('express')
const router = express.Router();
const Transaction = require("../models/Transactions")
const validators = require("../validators/validators")
const Account = require("../models/Account");

router.get('/', (req, res) => {
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

        if(source === destination)
            throw new Error("Transactions must be between different accounts")

        validators.validateTransactionAmount(amount)
        const sourceAccount = await validators.validateCbuAccount(source)
        const destinationAccount = await validators.validateCbuAccount(destination)

        if(amount > sourceAccount.balance){
            throw new Error("Insufficient Balance")
        }

        await Account.findOneAndUpdate({_id: sourceAccount._id}, {balance: parseInt(sourceAccount.balance) - parseInt(amount)});
        await Account.findOneAndUpdate({_id: destinationAccount._id}, {balance: parseInt(destinationAccount.balance) + parseInt(amount)});

        const transaction =  await Transaction.create({
            source: sourceAccount,
            destination: destinationAccount,
            amount: amount,
            date: new Date(),
            motive: motive,
            tag: tag,
        });

        res.status(200).json({
            id: transaction._id,
            source: sourceAccount.cbu,
            destination: destinationAccount.cbu,
            amount: transaction.amount,
            date: transaction.date,
            motive: transaction.motive,
            tag: transaction.tag,
        })

    } catch (e) {
        res.status(400).json({error: e.message})
    }
})

router.get('/:id', (req, res) => {

})

module.exports = router;