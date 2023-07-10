const express = require('express')
const router = express.Router();
const mongoose = require("mongoose");
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

    if (decomposedData.entityNumber != CBU_ENTITY_NUMBER) {
        throw new Error('Transaction does not exist');
    }

    return (decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000n).toString();
}

router.get('/', async (req, res) => {
    const {page = 1, size= 15, start, end, source, destination, involving} = req.query;

    try {
        if ((source || destination) && involving) {
            throw new Error("Cant query by source or destination params with also involving param");
        }

        const filters = {};
        if (start) {
            filters["date"] = {$gte: new Date(start)};
        }

        if (end) {
            if (filters["date"]) {
                filters["date"]["$lte"] = new Date(end);
            } else {
                filters["date"] = {$lte: new Date(end)};
            }
        }

        if (source) {
            filters.source = checkCbu(source);
        }

        if (destination) {
            filters.destination = checkCbu(destination);
        }

        if (involving) {
            const cbuRaw = checkCbu(involving);
            filters["$or"] = [{ source: cbuRaw }, { destination: cbuRaw }];
        }

        if (isNaN(page)) {
            throw new Error("Query param \"page\" must be a number");
        }

        if (isNaN(size)) {
            throw new Error("Query param \"size\" must be a number");
        }

        const pagination = await Transaction.paginate(filters, {limit: size, page: page});
        const transactions = pagination.docs;

        const resTransaction = [];

        transactions.forEach(d => resTransaction.push({
            id: d._id,
            source: cbuUtils.fromRaw(CBU_ENTITY_NUMBER, BigInt(d.source) / 10000000000000n, BigInt(d.source) % 10000000000000n),
            destination: cbuUtils.fromRaw(CBU_ENTITY_NUMBER, BigInt(d.destination) / 10000000000000n, BigInt(d.destination) % 10000000000000n),
            amount: d.amount,
            date: d.date,
            motive: d.motive,
            tag: d.tag
        }));

        console.info(`[INFO] GET /transactions`);
        return res.status(200).json(resTransaction).send();
    } catch (e) {
        try {
            console.error(`[ERROR] GET /transactions: ${e.message}`);
            return res.status(400).json({error: e.message}).send();
        } catch {

        }
    }
});

router.post('/', async (req, res) => {
    const {source, destination, amount, motive, tag} = req.body;
    const session = await mongoose.startSession();
    let transaction = null;

    try {
        let sourceAccount = undefined, destinationAccount = undefined;

        await session.withTransaction(async () => {
            if (!source) {
                throw new Error("Parameter \"source\" missing");
            }

            if (!destination) {
                throw new Error("Parameter \"destination\" missing");
            }

            if (!amount) {
                throw new Error("Parameter \"amount\" missing");
            }

            if (source === destination) {
                throw new Error("Transactions must be between different accounts");
            }

            const amountd = validators.validateTransactionAmount(amount);
            sourceAccount = await validators.validateCbuAccount(source, true, amountd);
            destinationAccount = await validators.validateCbuAccount(destination, false, amountd);

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

        console.info(`[INFO] POST /transactions`);
        return res.status(201).json({
            id: transaction._id,
            source: sourceAccount.cbu,
            destination: destinationAccount.cbu,
            amount: transaction.amount,
            date: transaction.date,
            motive: transaction.motive,
            tag: transaction.tag,
        }).send();
    } catch (e) {
        try {
            console.info(`[ERROR] POST /transactions: ${e.message}`);
            return res.status(400).json({error: e.message}).send();
        } catch {

        }
    } finally {
        await session.endSession();
    }
});

router.get('/:id', async (req, res) => {
    const id = req.params.id;

    try {
        const transaction = await Transaction.findOne({"_id": id});

        if (!transaction) {
            console.warn(`[WARN] GET /transactions/${id}: not found`);
            return res.status(404).json({error: "Transaction not found"}).send();
        }

        console.info(`[INFO] GET /transactions/${id}`);
        return res.status(200).json({
            id: transaction._id,
            source: cbuUtils.fromRaw(CBU_ENTITY_NUMBER, BigInt(transaction.source) / 10000000000000n, BigInt(transaction.source) % 10000000000000n),
            destination: cbuUtils.fromRaw(CBU_ENTITY_NUMBER, BigInt(transaction.destination) / 10000000000000n, BigInt(transaction.destination) % 10000000000000n),
            amount: transaction.amount,
            date: transaction.date,
            motive: transaction.motive,
            tag: transaction.tag,
        }).send();
    } catch (e) {
        try {
            console.error(`[ERROR] GET /transactions/${id}: ${e.message}`);
            return res.status(500).json({error: e.message}).send();
        } catch {

        }
    }
});

router.delete('/:id', async (req, res) => {
    const id = req.params.id.toString();

    try {
        await session.withTransaction(async () => {
            const transaction = await Transaction.findOne({"_id": id});

            if (!transaction) {
                return res.status(404).json({error: "Transaction not found"}).send();
            }

            const sourceAccount = await Account.find({_id: transaction.source}).exec();
            const destinationAccount = await Account.find({_id: transaction.destination}).exec();

            const sourceBalance = new BigDecimal(sourceAccount.balance.toString());
            const destinationBalance = new BigDecimal(destinationAccount.balance.toString());

            await Account.findOneAndUpdate({_id: sourceAccount._id}, {balance: (sourceBalance.add(amountd)).toString()});
            await Account.findOneAndUpdate({_id: destinationAccount._id}, {balance: (destinationBalance.subtract(amountd)).toString()});
            await Transaction.deleteOne({_id: transaction._id});
            console.error(`[INFO] DELETE /transactions/${id}`);
            return res.status(204).send();
        });
    } catch (e) {
        try {
            console.error(`[ERROR] DELETE /transactions/${id}: ${e.message}`);
            return res.status(500).json({error: e.message}).send();
        } catch {

        }
    }
});

module.exports = router;
