const mongoose = require('mongoose')
const cbuUtils = require('../cbuUtils')

const Schema = mongoose.Schema
const CBU_ENTITY_NUMBER = 2;
let current_raw_cbu = 0

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
    if (this.isNew) {
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
    const branch_number = self.cbu_raw / 10000000000000;
    const account_number = self.cbu_raw % 10000000000000;
    return cbuUtils.fromRaw(CBU_ENTITY_NUMBER, branch_number, account_number);
});

AccountSchema.virtual('is_central').get(function() {
    return self.cbu_raw === 0;
});

// QuerySets
AccountSchema.query.where_active = function() {
    return this.where({ is_active: true });
}

AccountSchema.query.get_by_cbu = function(cbu) {
    const decomposedData = cbuUtils.decompose(cbu);
    if(decomposedData.entityNumber !== CBU_ENTITY_NUMBER){
        throw 'Account does not exist';
    }
    const cbu_raw = decomposedData.accountNumber + decomposedData.branchNumber * 10000000000000;
    return this.where({cbu_raw}).findOne();
}

AccountSchema.query.get_central = function() {
    return this.where({ cbu_raw: 0 }).findOne();
}

module.exports = mongoose.model('Account', AccountSchema);