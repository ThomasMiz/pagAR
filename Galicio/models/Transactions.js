const mongoose = require('mongoose');
const cbuUtils = require('../cbuUtils');
const Schema = mongoose.Schema;
const mongoosePaginate = require('mongoose-paginate-v2')

const CBU_ENTITY_NUMBER = BigInt("2");

const TransactionSchema = new Schema({
    source: {
        type: String,
        ref: 'Account',
        required: true
    },

    destination: {
        type: String,
        ref: 'Account',
        required: true
    },

    amount: {
        type: String,
        required: true
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

    const cbuRaw = decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000n;
    return this.find().where({ $or: [{ source: cbuRaw }, { destination: cbuRaw }] })
};

TransactionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Transaction', TransactionSchema);