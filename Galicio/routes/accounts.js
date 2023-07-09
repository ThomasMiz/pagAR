const express = require('express')
const router = express.Router();
const Account = require('../models/Account');
const mongoose = require("mongoose");
const BigDecimal = require('../bigdecimal');

router.get('/', async (req, res) => {
    try {
        const account = await Account.find().whereActive().exec()
        const resAccount = []

        account.forEach(d => resAccount.push({
            cbu: d.cbu,
            balance: d.balance,
            active: d.active
        }))
        res.status(200).json(resAccount)
    }catch (e) {
        res.status(400).json({error: e.message})
    }
});

router.post('/', async (req, res) => {
    const session = await mongoose.startSession();
    const {central} = req.body;
    let account = null;
    let resAccount = null;

    try {
        await session.withTransaction(async () => {
            if (central) {
                if (await Account.find().getCentral()) {
                    return res.status(409).json({error: "Central already exists"});
                } else {
                    account =  await Account.create({_id: "0"});
                }
            } else {
                account = await Account.create({});
            }

            resAccount = {
                cbu: account.cbu,
                balance: account.balance.toString(),
                active: account.active
            }
        });
        await session.commitTransaction();    
        res.status(201).json(resAccount);
    } catch (e) {
        res.status(400).json({error: e.message});
    } finally {
        session.endSession();
    }
});

router.get('/:cbu', async (req, res) => {
    const cbu = req.params.cbu

    try {
        const account = await Account.find().getByCbu(cbu).exec()

        if (!account) {
            res.status(404).json({"error": "Account does not exist"});
        }

        res.status(200).json({
            cbu: account.cbu,
            balance: account.balance,
            active: account.active
        })
    } catch (e) {
        res.status(400).json({error: e.message})
    }
})

router.delete('/:cbu', async (req, res) => {
    const session = await mongoose.startSession();
    const cbu = req.params.cbu

    try {
        await session.withTransaction(async () => {
            const account = await Account.find().getByCbu(cbu).exec()

            if (!account) {
                throw new Error("No account was found");
            }

            if (!account.active) {
                throw new Error("Account already deleted");
            }

            await Account.findOneAndUpdate({_id: account._id}, {active: false}, {session, new:true});
        });

        await session.commitTransaction();
        res.status(204).json();

    } catch (e) {
        res.status(400).json({error: e.message})
    } finally {
        session.endSession();
    }
})

router.put('/:cbu', async (req, res) => {
    const session = await mongoose.startSession();
    const {balance} = req.body
    const cbu = req.params.cbu

    try {
        await session.withTransaction(async () => {
            if (!balance) {
                throw new Error('Parameter "balance" missing')
            }
    
            const balanced = new BigDecimal(balance.toString());
            const account = await Account.find().getByCbu(cbu).exec()
    
            if (!account) {
                throw new Error("No account was found");
            }
    
            if (!account.active) {
                throw new Error("Account already deleted");
            }
    
            await Account.findOneAndUpdate({_id: account._id}, {balance: balanced.toString()});
        });
        await session.commitTransaction();
        res.status(204).send();
    } catch (e){
        res.status(400).json({error: e.message})
    } finally {
        session.endSession();
    }
})

module.exports = router;
