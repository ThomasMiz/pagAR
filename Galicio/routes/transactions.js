const express = require('express')
const router = express.Router();
const Transactions = require("../models/Transactions")
const validators = require("../validators/validators")
const Account = require("../models/Account");
const {date} = require("joi");

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

        //todo: fix error no entering in function, don't know why
        await Transactions.find().validateCbuGetAccount(source).exec()
        await Transactions.find().validateCbuGetAccount(destination).exec()

        const sourceAccount = await Account.find().getByCbu(source).exec()
        const destinationAccount = await Account.find().getByCbu(destination).exec()

        if(amount > sourceAccount.balance){
            throw new Error("Insufficient Balance")
        }

        await Account.findOneAndUpdate({cbu_raw: sourceAccount.cbu_raw}, {balance: sourceAccount.balance -= amount});
        await Account.findOneAndUpdate({cbu_raw: sourceAccount.cbu_raw}, {balance: destinationAccount.balance += amount});

        // res.status(200).json({
        //     source: source,
        //     destination: destination,
        //     date: new Date(),
        //     motive: motive,
        //     tag: tag,
        // })

        res.status(200).json({hi: "mundo"})

    } catch (e) {
        res.status(400).json({error: e.message})
    }
})

router.get('/:id', (req, res) => {

})

module.exports = router;