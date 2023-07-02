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
        const destinationAccount = await validators.validateCbuAccount(source)

        if(amount > sourceAccount.balance){
            throw new Error("Insufficient Balance")
        }

        await Account.findOneAndUpdate({cbu_raw: sourceAccount.cbu_raw}, {balance: parseInt(sourceAccount.balance) - parseInt(amount)});
        await Account.findOneAndUpdate({cbu_raw: destinationAccount.cbu_raw}, {balance: parseInt(destinationAccount.balance) + parseInt(amount)});

        //TODO: Fix bug balances in accounts after transaction
        const account =  await Transaction.create({
            source: sourceAccount,
            destination: destinationAccount,
            amount: amount,
            date: new Date(),
            motive: motive,
            tag: tag,
        });

        res.status(200).json(account)

    } catch (e) {
        res.status(400).json({error: e.message})
    }
})

router.get('/:id', (req, res) => {

})

module.exports = router;