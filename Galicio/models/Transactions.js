const mongoose = require('mongoose');
const cbuUtils = require('../cbuUtils');
const Schema = mongoose.Schema;

const CBU_ENTITY_NUMBER = 2;

const TransactionSchema = new Schema({
    source: {
        type: Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },

    destination: {
        type: Schema.Types.ObjectId,
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

TransactionSchema.query.where_source_cbu = function (cbu) {
    const decomposedData = cbuUtils.decompose(cbu);
    if (!decomposedData.isOk) {
        throw new Error('Invalid verification digits');
    }
    if (decomposedData.entityNumber !== CBU_ENTITY_NUMBER) {
        throw new Error('Transaction does not exist');
    }
    const cbu_raw = decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000;
    return this.where({ source_cbu_raw: cbu_raw });
};

TransactionSchema.query.where_destination_cbu = function (cbu) {
    const decomposedData = cbuUtils.decompose(cbu);
    if (!decomposedData.isOk) {
        throw new Error('Invalid verification digits');
    }
    if (decomposedData.entityNumber !== CBU_ENTITY_NUMBER) {
        throw new Error('Transaction does not exist');
    }
    const cbu_raw = decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000;
    return this.where({ destination_cbu_raw: cbu_raw });
};

TransactionSchema.query.involving_cbu = function (cbu) {
    const decomposedData = cbuUtils.decompose(cbu);
    if (!decomposedData.isOk) {
        throw new Error('Invalid verification digits');
    }
    if (decomposedData.entityNumber !== CBU_ENTITY_NUMBER) {
        throw new Error('Transaction does not exist');
    }
    const cbu_raw = decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000;
    return this.where({ $or: [{ source_cbu_raw: cbu_raw }, { destination_cbu_raw: cbu_raw }] });
};

module.exports = mongoose.model('Transaction', TransactionSchema);