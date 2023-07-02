const cbuUtils = require("../cbuUtils")
const dotenv = require('dotenv');
const Account = require("../models/Account")

async function validateCbuAccount(cbu, isSource) {
    const {entityNumber, isOk} = cbuUtils.decompose(cbu)

    if (!isOk) {
        throw new Error("CBU Checksum doesn't match")
    }

    const account = await Account.find().getByCbu(cbu).exec()

    if(!isSource && !account.is_active){
        throw new Error("Can not transfer money to a deleted account")
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
module.exports.validateCbuAccount = validateCbuAccount;
