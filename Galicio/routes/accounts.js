const express = require('express')
const router = express.Router();
const Account = require('../models/Account');
const mongoose = require("mongoose");
const BigDecimal = require('../bigdecimal');

router.get('/', async (req, res) => {
    const {page = 1, size = 15} = req.query;

    try {
        if (isNaN(page)) {
            throw new Error("Query param \"page\" must be a number");
        }

        if (isNaN(size)) {
            throw new Error("Query param \"size\" must be a number");
        }

        const pagination = await Account.paginate({active: true}, {limit: size, page: page});
        const accounts = pagination.docs;

        const resAccount = [];

        accounts.forEach(d => resAccount.push({
            cbu: d.cbu,
            balance: d.balance,
            active: d.active
        }));

        return res.status(200).json(resAccount).send();
    } catch (e) {
        return res.status(400).json({error: e.message}).send();
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
                    return res.status(409).json({error: "Central already exists"}).send();
                } else {
                    account = await Account.create({_id: "0"});
                }
            } else {
                account = await Account.create({});
            }

            resAccount = {
                cbu: account.cbu,
                balance: account.balance.toString(),
                active: account.active
            };

            return res.status(201).json(resAccount).send();
        });
    } catch (e) {
        return res.status(400).json({error: e.message}).send();
    } finally {
        await session.endSession();
    }
});

router.get('/:cbu', async (req, res) => {
    const cbu = req.params.cbu;

    try {
        const account = await Account.find().getByCbu(cbu).exec();

        if (!account) {
            res.status(404).json({"error": "Account does not exist"}).send();
        }

        res.status(200).json({
            cbu: account.cbu,
            balance: account.balance,
            active: account.active
        }).send();
    } catch (e) {
        res.status(400).json({error: e.message}).send();
    }
})

router.delete('/:cbu', async (req, res) => {
    const session = await mongoose.startSession();
    const cbu = req.params.cbu;

    try {
        await session.withTransaction(async () => {
            const account = await Account.find().getByCbu(cbu).exec();

            if (!account) {
                throw new Error("No account was found");
            }

            if (!account.active) {
                throw new Error("Account already deleted");
            }

            if (account.isCentral) {
                throw new Error("Cannot delete central account");
            }

            await Account.findOneAndUpdate({_id: account._id}, {active: false}, {session, new:true});
        });

        await session.commitTransaction();
        return res.status(204).json().send();
    } catch (e) {
        return res.status(400).json({error: e.message}).send();
    } finally {
        session.endSession();
    }
})

router.put('/:cbu', async (req, res) => {
    const session = await mongoose.startSession();
    const {balance} = req.body;
    const cbu = req.params.cbu;

    try {
        await session.withTransaction(async () => {
            if (!balance) {
                throw new Error('Parameter "balance" missing');
            }
    
            const balanced = new BigDecimal(balance.toString());
            const account = await Account.find().getByCbu(cbu).exec();
    
            if (!account) {
                throw new Error("No account was found");
            }
    
            if (!account.active) {
                throw new Error("Account already deleted");
            }
    
            await Account.findOneAndUpdate({_id: account._id}, {balance: balanced.toString()});
        });
        await session.commitTransaction();
        return res.status(204).send();
    } catch (e){
        return res.status(400).json({error: e.message}).send();
    } finally {
        session.endSession();
    }
})

module.exports = router;
