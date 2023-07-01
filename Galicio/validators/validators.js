function validateTransactionAmount(amount){
    try{

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
    }catch(e){
        console.error("Error validating amount", e.message)
    }
}

module.exports.validateTransactionAmount = validateTransactionAmount;