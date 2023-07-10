const cbuUtils = require("../cbuUtils")
const dotenv = require('dotenv');
const Account = require("../models/Account");
const BigDecimal = require("../bigdecimal");

async function validateCbuAccount(cbu, isSource, amountd) {
    const {entityNumber, branchNumber, accountNumber, isOk} = cbuUtils.decompose(cbu);

    if (!isOk) {
        throw new Error("CBU Checksum doesn't match")
    }

    const account = await Account.find().getByCbu(cbu).exec();

    if (!account) {
        throw new Error((isSource ? "Source" : "Destination") + " account doesn't exist");
    }

    const isCentral = branchNumber == 0 && accountNumber == 0;
    if (isSource) {
        if (!isCentral && amountd.isGreaterThan(account.balance)) {
            throw new Error("Insufficient Balance");
        }
    } else {
        if (!account.active) {
            throw new Error("Cannot transfer money to a deleted account");
        }
    }

    return account;
}

function validateTransactionAmount(amount) {
    amount = amount.toString();

    if (!amount.match(/^[0-9]+(.[0-9]+)?$/)) {
        throw new Error('Not a valid amount');
    }

    const decimal = new BigDecimal(amount);

    if (decimal.isLesserOrEqualThan(0)) {
        throw new Error('Amount must by greater than 0');
    }

    const amountString = amount.toString();
    const decimalDigits = (amountString.split('.')[1] || '').length;

    if (decimalDigits > 2) {
        throw new Error('Amount must have at most two decimal digits');
    }

    return decimal;
}

module.exports.validateTransactionAmount = validateTransactionAmount;
module.exports.validateCbuAccount = validateCbuAccount;
