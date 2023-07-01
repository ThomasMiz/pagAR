const cbuUtils = require("../cbuUtils")
const Account = require("../models/Account")

async function validateCbuGetAccount(cbu) {
    const {entityNumber, isOk} = cbuUtils.decompose(cbu)

    if (!isOk) {
        throw new Error("CBU Checksum doesn't match")
    }

    //todo: check entity number, but before do that put entity_number in a constants file

    const account = await Account.find().getByCbu().exec()

    if(!account.is_active){
        throw new Error("CBU does not exist locally")
    }

    return account
}

function validateTransactionAmount(amount){

    const decimal = parseFloat(amount)

    if (isNaN(decimal)) {
        throw new Error('Not a valid amount');
    }

    if (decimal <= 0) {
        throw new Error('Amount must by greater than 0');
    }

    const amountString = amount.toString();
    const decimalDigits = (amountString.split('.')[1] || '').length;

    if (decimalDigits > 2) {
        throw new Error('Amount must have at most two decimal digits');
    }
}

module.exports.validateTransactionAmount = validateTransactionAmount;
module.exports.validateCbuGetAccount = validateCbuGetAccount;
