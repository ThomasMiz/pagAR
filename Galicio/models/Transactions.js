const mongoose = require('mongoose');
const cbuUtils = require('../cbuUtils');
const Account = require("./Account");
const Schema = mongoose.Schema;

const CBU_ENTITY_NUMBER = 2;

const TransactionSchema = new Schema({
    source: {
        type: Number,
        ref: 'Account',
        required: true
    },

    destination: {
        type: Number,
        ref: 'Account',
        required: true
    },

    amount: {
        type: Number,
        required: true,
        default: 0.0
    },

    date: {
        type: Date,
        required: true,
        default: Date.now
    },

    motive: {
        type: String,
        maxLength: 200
    },

    tag: {
        type: String,
        maxLength: 32
    }
});

TransactionSchema.query.involvingCbu = function (cbu) {

    const decomposedData = cbuUtils.decompose(cbu);
    if (!decomposedData.isOk) {
        throw new Error('Invalid verification digits');
    }
    if (decomposedData.entityNumber !== CBU_ENTITY_NUMBER) {
        throw new Error('Transaction does not exist');
    }
    const cbu_raw = decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000;
    return this.find().where({ $or: [{ source: cbu_raw }, { destination: cbu_raw }] })
};

module.exports = mongoose.model('Transaction', TransactionSchema);