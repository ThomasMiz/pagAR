const express = require('express')
const router = express.Router();
const Transaction = require("../models/Transactions")
const validators = require("../validators/validators")
const Account = require("../models/Account");
const cbuUtils = require('../cbuUtils');
const BigDecimal = require("../bigdecimal");
const {CBU_ENTITY_NUMBER} = require('../constants');

function checkCbu(cbu) {
    const decomposedData = cbuUtils.decompose(cbu);
    if (!decomposedData.isOk) {
        throw new Error('Invalid verification digits');
    }

    if (decomposedData.entityNumber !== CBU_ENTITY_NUMBER) {
        throw new Error('Transaction does not exist');
    }

    return decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000n;
}

router.get('/', async (req, res) => {

    const {page = 1, size= 15, start, end, source, destination, involving} = req.query

    try {

        if((source || destination) && involving){
            throw new Error("Cant query by source or destination params with also involving param")
        }

        const filters = {}
        if(start){
            filters["date"] = {$gte: start}
        }

        if(end){

            if(filters["date"]){
                filters["date"]["$lte"] = start
            }else{
                filters["date"] = {$lte: end}
            }
        }

        if(source){
            filters.source = checkCbu(source).toString()
        }

        if(destination){
            filters.destination = checkCbu(destination).toString()
        }

        if(involving){
            const cbuRaw = checkCbu(involving).toString()
            filters["$or"] = [{ source: cbuRaw }, { destination: cbuRaw }]
        }

        if(isNaN(page)){
            throw new Error("Query param \"page\" must be a number")
        }

        if(isNaN(size)) {
            throw new Error("Query param \"size\" must be a number")
        }

        const pagination = await Transaction.paginate(filters, {limit: size, page: page});
        const transactions = pagination.docs

        const resTransaction = [];

        transactions.forEach(d => resTransaction.push({
            id: d._id,
            source: cbuUtils.fromRaw(CBU_ENTITY_NUMBER, BigInt(d.source) / 10000000000000n, BigInt(d.source) % 10000000000000n),
            destination: cbuUtils.fromRaw(CBU_ENTITY_NUMBER, BigInt(d.destination) / 10000000000000n, BigInt(d.destination) % 10000000000000n),
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
    const session = await mongoose.startSession();
    let transaction = null

    try {
        await session.withTransaction(async () => {
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

            transaction =  await Transaction.create({
                source: sourceAccount,
                destination: destinationAccount,
                amount: amountd.toString(),
                date: new Date(),
                motive: motive,
                tag: tag,
            });
        });
            
        await session.commitTransaction();
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
    } finally {
        session.endSession();
    }
})

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const transaction = await Transaction.findOne({"_id": id});

        res.status(200).json({
            id: transaction._id,
            source: cbuUtils.fromRaw(CBU_ENTITY_NUMBER, BigInt(transaction.source) / 10000000000000n, BigInt(transaction.source) % 10000000000000n),
            destination: cbuUtils.fromRaw(CBU_ENTITY_NUMBER, BigInt(transaction.destination) / 10000000000000n, BigInt(transaction.destination) % 10000000000000n),
            amount: transaction.amount,
            date: transaction.date,
            motive: transaction.motive,
            tag: transaction.tag,
        });
    }catch (e) {
        res.status(500).json({error: e.message});
    }
})

module.exports = router;
