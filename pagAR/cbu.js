function checksum1(entityNumber, branchNumber) {
    entityNumber = entityNumber.toString().padStart(3, '0');
    branchNumber = branchNumber.toString().padStart(4, '0');
    let sum1 = parseInt(entityNumber[0]) * 7 + parseInt(entityNumber[1]) + parseInt(entityNumber[2]) * 3;
    sum1 += parseInt(branchNumber[0]) * 9 + parseInt(branchNumber[1]) * 7 + parseInt(branchNumber[2]) * 1 + parseInt(branchNumber[3]) * 3;
    return (10 - (sum1 % 10)) % 10;
}

function checksum2(accountNumber) {
    accountNumber = accountNumber.toString().padStart(13, '0');
    let sum1 = parseInt(accountNumber[0]) * 3 + parseInt(accountNumber[1]) * 9 + parseInt(accountNumber[2]) * 7;
    sum1 += parseInt(accountNumber[3]) * 1 + parseInt(accountNumber[4]) * 3 + parseInt(accountNumber[5]) * 9;
    sum1 += parseInt(accountNumber[6]) * 7 + parseInt(accountNumber[7]) * 1 + parseInt(accountNumber[8]) * 3;
    sum1 += parseInt(accountNumber[9]) * 9 + parseInt(accountNumber[10]) * 7 + parseInt(accountNumber[11]) * 1;
    sum1 += parseInt(accountNumber[12]) * 3;
    return (10 - (sum1 % 10)) % 10;
}


/** Constructs a CBU by putting together the entity number, branch number, and account number */
function fromRaw(entityNumber, branchNumber, accountNumber) {
    return entityNumber.toString().padStart(3, '0') + branchNumber.toString().padStart(4, '0') + checksum1(entityNumber, branchNumber).toString() + accountNumber.toString().padStart(13, '0') + checksum2(accountNumber).toString();
}

/** Decomposes a CBU and returns its entityNumber, branchNumber, accountNumber, isOk */
function decompose(cbu) {
    cbu = cbu.toString().padStart(22, '0');
    const entityNumber = parseInt(cbu.substring(0, 3));
    const branchNumber = parseInt(cbu.substring(3, 7));
    const accountNumber = parseInt(cbu.substring(8, 21));
    const isOk = parseInt(cbu[7]) == checksum1(entityNumber, branchNumber) && parseInt(cbu[21]) == checksum2(accountNumber)
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
