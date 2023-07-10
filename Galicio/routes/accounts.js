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

        console.info(`[INFO] GET /accounts?page=${page}&size=${size}`);
        return res.status(200).json(resAccount).send();
    } catch (e) {
        console.error(`[ERROR] GET /accounts?page=${page}&size=${size}`);
        try {
            return res.status(400).json({error: e.message}).send();
        } catch {

        }
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
                    console.warn(`[WARN] POST /accounts?central=${central} already exists`);
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

            console.info(`[INFO] POST /accounts?central=${central}`);
            return res.status(201).json(resAccount).send();
        });
    } catch (e) {
        try {
            console.error(`[ERROR] POST /accounts?central=${central}: ${e.message}`);
            return res.status(400).json({error: e.message}).send();
        } catch {

        }
    } finally {
        await session.endSession();
    }
});

router.get('/:cbu', async (req, res) => {
    const cbu = req.params.cbu;

    try {
        const account = await Account.find().getByCbu(cbu).exec();

        if (!account) {
            console.warn(`[WARN] GET /accounts/${cbu} not found`);
            res.status(404).json({"error": "Account does not exist"}).send();
        }

        console.info(`[INFO] GET /accounts/${cbu}`);
        res.status(200).json({
            cbu: account.cbu,
            balance: account.balance,
            active: account.active
        }).send();
    } catch (e) {
        try {
            console.error(`[ERROR] GET /accounts/${cbu}: ${e.message}`);
            res.status(400).json({error: e.message}).send();
        } catch {

        }
    }
})

router.delete('/:cbu', async (req, res) => {
    const session = await mongoose.startSession();
    const cbu = req.params.cbu;

    try {
        await session.withTransaction(async () => {
            const account = await Account.find().getByCbu(cbu).exec();

            if (!account) {
                console.warn(`[WARN] DELETE /accounts/${cbu} not found`);
                return res.status(404).json({error: "Not found"}).send();
            }

            if (!account.active) {
                throw new Error("Account already deleted");
            }

            if (account.isCentral) {
                throw new Error("Cannot delete central account");
            }

            await Account.findOneAndUpdate({_id: account._id}, {active: false}, {session, new:true});
        });

        console.info(`[INFO] DELETE /accounts/${cbu}`);
        return res.status(204).send();
    } catch (e) {
        try {
            console.error(`[ERROR] DELETE /accounts/${cbu}: ${e.message}`);
            return res.status(400).json({error: e.message}).send();
        } catch {

        }
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
        console.info(`[INFO] PUT /accounts/${cbu}`);
        return res.status(204).send();
    } catch (e) {
        try {
            console.error(`[ERROR] PUT /accounts/${cbu}: ${e.message}`);
            return res.status(400).json({error: e.message}).send();
        } catch {

        }
    } finally {
        session.endSession();
    }
})

module.exports = router;
