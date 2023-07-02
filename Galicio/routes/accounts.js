const express = require('express')
const router = express.Router();
const Account = require('../models/Account');
const mongoose = require("mongoose");

router.get('/', async (req, res) => {

    try {
        const account = await Account.find().whereActive().exec()
        const resAccount = []

        account.forEach(d => resAccount.push({
            balance: d.balance,
            active: d.is_active,
            cbu: d.cbu
        }))
        res.status(200).json(resAccount)
    }catch (e) {
        res.status(400).json({error: e.message})
    }
});

router.post('/', async (req, res) => {
    const {central} = req.body;
    let account = null;

    try {
        if(central) {
            if(await Account.find().getCentral()){
                return res.status(409).json({error: "Central already exists"});
            } else {
                account =  await Account.create({_id: 0});
            }
        } else {
            account = await Account.create({});
        }

        const resAccount = {
            cbu: account.cbu,
            balance: account.balance,
            active: account.is_active
        }

        res.status(200).json(resAccount);
    } catch (e) {
        res.status(400).json({error: e.message});
    }
});

router.get('/:cbu', async (req, res) => {
    const cbu = req.params.cbu

    try {
        const account = await Account.find().getByCbu(cbu).exec()
        res.status(200).json(account)
    }catch (e) {
        res.status(400).json({error: e.message})
    }
})

router.delete('/:cbu', async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const cbu = req.params.cbu

    try {
        const account = await Account.find().getByCbu(cbu).exec()

        if(!account){
            throw new Error("No account was found");
        }

        if(!account.is_active) {
            throw new Error("Account already deleted");
        }

        const newAccount =  await Account.findOneAndUpdate({_id: account._id}, {is_active: false}, {session, new:true});
        await session.commitTransaction();

        res.status(200).json(newAccount)
    } catch (e) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({error: e.message})
    }
})

router.put('/:cbu', async (req, res) => {
    const {balance} = req.body
    const cbu = req.params.cbu

    //TODO: make ACID this method

    try {

        if(!balance){
            throw new Error('Parameter "balance" missing')
        }

        const account = await Account.find().getByCbu(cbu).exec()

        if(!account){
            throw new Error("No account was found");
        }

        if(!account.is_active) {
            throw new Error("Account already deleted");
        }

        const newAccount =  await Account.findOneAndUpdate({cbu_raw: account.cbu_raw}, {balance: balance});
        res.status(200).json(newAccount)
    } catch (e){
        res.status(400).json({error: e.message})
    }
})

module.exports = router;
