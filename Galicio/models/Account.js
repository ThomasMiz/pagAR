const mongoose = require('mongoose')
const cbuUtils = require('../cbuUtils')

const Schema = mongoose.Schema

let current_raw_cbu = 1
const CBU_ENTITY_NUMBER = 2;

const AccountSchema = new Schema({
    cbu_raw: {
        type: Number,
        unique: true,
    },

    balance: {
        type: Number,
        default: 0.0
    },

    is_active: {
        type: Boolean,
        default: true
    }
});

AccountSchema.pre('save', async function (next) {
    if (this.isNew && this.get('cbu_raw') !== 0) {
        const latestAccount = await this.constructor.findOne({}, {}, {sort: {cbu_raw: -1}});
        if (latestAccount) {
            current_raw_cbu = latestAccount.cbu_raw + 1;
        }
        this.cbu_raw = current_raw_cbu
    }
    next();
});

// Properties
AccountSchema.virtual('cbu').get(function() {
    const branch_number = Math.floor(this.cbu_raw / 10000000000000);
    const account_number = this.cbu_raw % 10000000000000;
    return cbuUtils.fromRaw(CBU_ENTITY_NUMBER, branch_number, account_number);
});

AccountSchema.virtual('is_central').get(function() {
    return this.cbu_raw === 0;
});

// QuerySets
AccountSchema.query.whereActive = function() {
    return this.where({ is_active: true });
}

AccountSchema.query.getByCbu = function(cbu) {

    console.log("holis")
    const decomposedData = cbuUtils.decompose(cbu);
    if (!decomposedData.isOk){
        throw new Error('Invalid verification digits')
    }
    if(decomposedData.entityNumber !== CBU_ENTITY_NUMBER){
        throw new Error('Account does not exist');
    }

    const cbu_raw = decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000;
    return this.where({cbu_raw}).findOne();
}

AccountSchema.query.getCentral = function() {
    return this.where({ cbu_raw: 0 }).findOne();
}

module.exports = mongoose.model('Account', AccountSchema);