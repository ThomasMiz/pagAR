const express = require('express')
const router = express.Router();
const mongoose = require("mongoose");
const Transactions = require("../models/Transactions")
const validators = require("../validators/validators")

router.get('/', (req, res) => {
})

router.post('/', (req, res) => {
    const {source, destination, amount, motive, tag} = req.body

    try{
        if(!source){
            throw "Parameter \"source\" missing"
        }

        if(!destination){
            throw "Parameter \"destination\" missing"
        }

        if(!amount){
            throw "Parameter \"amount\" missing"
        }

        validators.validateTransactionAmount(amount)



    }catch(e){
        res.status(400).json({error: e.message})
    }
})

router.get('/:id', (req, res) => {

})