function checksum1(entityNumber, branchNumber) {
    entityNumber = entityNumber.toString().padStart(3, '0');
    branchNumber = branchNumber.toString().padStart(4, '0');
    let sum1 = BigInt(entityNumber[0]) * 7n + BigInt(entityNumber[1]) + BigInt(entityNumber[2]) * 3n;
    sum1 += BigInt(branchNumber[0]) * 9n + BigInt(branchNumber[1]) * 7n + BigInt(branchNumber[2]) * 1n + BigInt(branchNumber[3]) * 3n;
    return (10n - (sum1 % 10n)) % 10n;
}

function checksum2(accountNumber) {
    accountNumber = accountNumber.toString().padStart(13, '0');
    let sum1 = BigInt(accountNumber[0]) * 3n + BigInt(accountNumber[1]) * 9n + BigInt(accountNumber[2]) * 7n;
    sum1 += BigInt(accountNumber[3]) * 1n + BigInt(accountNumber[4]) * 3n + BigInt(accountNumber[5]) * 9n;
    sum1 += BigInt(accountNumber[6]) * 7n + BigInt(accountNumber[7]) * 1n + BigInt(accountNumber[8]) * 3n;
    sum1 += BigInt(accountNumber[9]) * 9n + BigInt(accountNumber[10]) * 7n + BigInt(accountNumber[11]) * 1n;
    sum1 += BigInt(accountNumber[12]) * 3n;
    return (10n - (sum1 % 10n)) % 10n;
}


/** Constructs a CBU by putting together the entity number, branch number, and account number */
function fromRaw(entityNumber, branchNumber, accountNumber) {
    return entityNumber.toString().padStart(3, '0') + branchNumber.toString().padStart(4, '0') + checksum1(entityNumber, branchNumber).toString() + accountNumber.toString().padStart(13, '0') + checksum2(accountNumber).toString();
}

/** Decomposes a CBU and returns its entityNumber, branchNumber, accountNumber, isOk */
function decompose(cbu) {
    cbu = cbu.toString().padStart(22, '0');
    const entityNumber = BigInt(cbu.substring(0, 3));
    const branchNumber = BigInt(cbu.substring(3, 7));
    const accountNumber = BigInt(cbu.substring(8, 21));
    const isOk = BigInt(cbu[7]) == checksum1(entityNumber, branchNumber) && BigInt(cbu[21]) == checksum2(accountNumber)
    return {"entityNumber": entityNumber, "branchNumber": branchNumber, "accountNumber": accountNumber, "isOk": isOk};
}

function isValid(cbu) {
    return decompose(cbu).isOk;
}

module.exports.checksum1 = checksum1;
module.exports.checksum2 = checksum2;
module.exports.fromRaw = fromRaw;
module.exports.decompose = decompose;
module.exports.isValid = isValid;
