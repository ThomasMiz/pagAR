const mongoose = require('mongoose')
const cbuUtils = require('../cbuUtils')
const {CBU_ENTITY_NUMBER} = require('../constants');

const Schema = mongoose.Schema;

const AccountSchema = new Schema({
    _id: {
        type: String,
    },

    balance: {
        type: String,
        default: "0"
    },

    active: {
        type: Boolean,
        default: true
    }
});

AccountSchema.pre('save', async function (next) {
    if (this.isNew && this.get('_id') != 0) {
        const latestAccount = await this.constructor.findOne({}, {}, {sort: {_id: -1}});
        const nextId = latestAccount ? (BigInt(latestAccount._id) + 1n) : "1";
        this._id = nextId.toString();
    }
    next();
});

// Properties
AccountSchema.virtual('cbu').get(function() {
    const branchNumber = BigInt(this._id) / 10000000000000n;
    const accountNumber = BigInt(this._id) % 10000000000000n;
    return cbuUtils.fromRaw(CBU_ENTITY_NUMBER, branchNumber, accountNumber);
});

AccountSchema.virtual('isCentral').get(function() {
    return this._id == "0";
});

// QuerySets
AccountSchema.query.whereActive = function() {
    return this.where({ active: true });
}

AccountSchema.query.getByCbu = function(cbu) {
    const decomposedData = cbuUtils.decompose(cbu);
    if (!decomposedData.isOk) {
        throw new Error('Invalid verification digits')
    }

    if (decomposedData.entityNumber != CBU_ENTITY_NUMBER) {
        throw new Error('Account does not exist');
    }

    const cbuRaw = decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000n;
    return this.where({_id: cbuRaw.toString()}).findOne();
}

AccountSchema.query.getCentral = function() {
    return this.where({ _id: "0" }).findOne();
}

module.exports = mongoose.model('Account', AccountSchema);