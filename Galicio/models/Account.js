const mongoose = require('mongoose')
const cbuUtils = require('../cbuUtils')

const CBU_ENTITY_NUMBER = 2;

const AccountSchema = new mongoose.Schema({
    cbu_raw: {
        type: {
            Number,
            validate: {
                validator: function (value) {
                    return /^\d{20}$/.test(value);
                },
                message: 'The cbu must be a 20 digits number'
            }},
        required: true,
        unique: true,
    },

    balance: {
        type: Number,
        required: true,
        default: 0.0
    },

    is_active: {
        type: Boolean,
        required: true,
        default: true
    }
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

AccountSchema.query.create_central = function() {
    return this.create({ cbu_raw: 0 });
}

AccountSchema.query.get_central = function() {
    return this.where({ cbu_raw: 0 }).findOne();
}

module.exports = mongoose.model('Account', AccountSchema);