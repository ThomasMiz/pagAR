const axios = require('axios');
const cbuUtils = require('./cbuUtils');

class EntityApi {
    baseUrl;
    entityNumber;
    name;

    centralCbu;

    constructor(baseUrl, entityNumber, name) {
        this.baseUrl = baseUrl;
        this.entityNumber = entityNumber;
        this.name = name;

        this.centralCbu = cbuUtils.fromRaw(entityNumber, 0, 0);
    }

    getAccounts(pageNumber, pageSize) {
        let params = {}
        if (pageNumber) params.page = pageNumber;
        if (pageSize) params.size = pageSize;
        return axios.get(this.baseUrl + "/api/accounts", {params: params});
    }

    createAccount() {
        return axios.post(this.baseUrl + "/api/accounts");
    }

    createCentralAccount() {
        return axios.post(this.baseUrl + "/api/accounts", { central: true });
    }

    getAccountByCbu(cbu) {
        return axios.get(this.baseUrl + "/api/accounts/" + cbu);
    }

    updateAccountByCbu(cbu, balance) {
        return axios.put(this.baseUrl + "/api/accounts/" + cbu, {balance: balance});
    }

    deleteAccountByCbu(cbu) {
        return axios.delete(this.baseUrl + "/api/accounts/" + cbu);
    }

    getTransactions(pageNumber, pageSize, source, destination, involving, start, end) {
        let params = {}
        if (pageNumber) params.page = pageNumber;
        if (pageSize) params.size = pageSize;
        if (source) params.source = source;
        if (destination) params.destination = destination;
        if (involving) params.involving = involving;
        if (start) params.start = start;
        if (end) params.end = end;
        return axios.get(this.baseUrl + "/api/transactions", {params: params});
    }

    createTransaction(source, destination, amount, motive, tag) {
        return axios.post(this.baseUrl + "/api/transactions", {
            source: source,
            destination: destination,
            amount: amount,
            motive: motive,
            tag: tag
        });
    }

    getTransactionById(id) {
        return axios.get(this.baseUrl + "/api/transactions/" + id);
    }
}

const entityApis = new Map();
let allEntityNumbers = []

function mapTransaction(tx) {
    let src = tx.source;
    let dst = tx.destination;
    if (cbuUtils.isCentral(src)) {
        src = tx.tag;
    } else if (cbuUtils.isCentral(dst)) {
        dst = tx.tag;
    }

    return {
        id: tx.id.toString() + cbuUtils.decompose(src).entityNumber.toString().padStart(3, '0'),
        source: src,
        destination: dst,
        amount: tx.amount,
        date: tx.date,
        motive: tx.motive
    };
}

function getApiForEntityOrThrow(entityNumber) {
    const apiInstance = entityApis.get(entityNumber);
    if (apiInstance) {
        return apiInstance;
    }

    throw 'CBU does not belong to a pagAR-affiliated bank';
}

function getApiForCbuOrThrow(cbu) {
    return getApiForEntityOrThrow(cbuUtils.decompose(cbu).entityNumber);
}

async function getAccounts(entityNumber, pageNumber, pageSize) {
    const response = await getApiForEntityOrThrow(entityNumber).getAccounts(pageNumber, pageSize);
    return response.data;
}

async function createAccount(entityNumber) {
    if (!entityNumber) {
        entityNumber = allEntityNumbers[parseInt(Math.random() * allEntityNumbers.length)];
    }

    const response = await getApiForEntityOrThrow(entityNumber).createAccount();
    return response.data;
}

async function getAccountByCbu(cbu) {
    const response = await getApiForCbuOrThrow(cbu).getAccountByCbu(cbu);
    return response.data;
}

async function updateAccountByCbu(cbu, balance) {
    const response = await getApiForCbuOrThrow(cbu).updateAccountByCbu(cbu, balance);
    return response.data;
}

async function deleteAccountByCbu(cbu) {
    const response = await getApiForCbuOrThrow(cbu).deleteAccountByCbu(cbu);
    return response.data;
}

async function getTransactionsInvolving(pageNumber, pageSize, involvingCbu, start, end) {
    const response = await getApiForCbuOrThrow(involvingCbu).getTransactions(pageNumber, pageSize, null, null, involvingCbu, start, end);

    const data = [];
    response.data.forEach(tx => data.push(mapTransaction(tx)));

    return data;
}

async function createTransaction(sourceCbu, destinationCbu, amount, motive) {
    const sourceEntityNumber = cbuUtils.decompose(sourceCbu).entityNumber;
    const destEntityNumber = cbuUtils.decompose(destinationCbu).entityNumber;

    if (sourceEntityNumber == destEntityNumber) {
        const response = await getApiForEntityOrThrow(sourceEntityNumber).createTransaction(sourceCbu, destinationCbu, amount, motive, "Desde pagAR");
        return response.data;
    }

    const sourceApi = getApiForEntityOrThrow(sourceEntityNumber);
    const destApi = getApiForEntityOrThrow(destEntityNumber);

    const sourceTx = await sourceApi.createTransaction(sourceCbu, sourceApi.centralCbu, amount, motive, destinationCbu);
    const destTx = await destApi.createTransaction(destApi.centralCbu, destinationCbu, amount, motive, sourceCbu);

    return mapTransaction(sourceTx.data);
}

async function getTransactionById(id) {
    id = id.toString();
    const entityNumber = id.substring(id.length - 3);
    const response = await getApiForEntityOrThrow(entityNumber).getTransactionById(id.substring(0, id.length - 3));
    return mapTransaction(response.data);
}

async function initializeEntityApis() {
    // Financial Entities are listed in this map, with the key being the entity number.
    entityApis.set(1, new EntityApi("http://localhost:8000", 1, "Santander Lago"));

    allEntityNumbers = [... entityApis.keys()]
    // For each entity API, call the create central account endpoint.
    let promises = [];
    entityApis.forEach(entityApi => {
        promises.push((async () => {
            let result = null;
            try {
                result = await entityApi.createCentralAccount()
            } catch (error) {
                result = error.response;
            }

            if (result.status >= 200 && result.status < 300) {
                console.info("[INFO] Central account for " + entityApi.name + " created");
            } else if (result.status == 409) {
                console.info("[INFO] Central account for " + entityApi.name + " already exists");
            } else {
                console.error("[ERROR] Central account for " + entityApi.name + " failed to create, status code " + result.status + " (expected 201 if created, 409 if already exists)", result);
            }
        })());
    });

    // Wait for all the create account requests to finish, ignore errors.
    await Promise.all(promises);
    console.info("[INFO] " + entityApis.size + " financial entities registered");
}

module.exports.getAccounts = getAccounts;
module.exports.createAccount = createAccount;
module.exports.getAccountByCbu = getAccountByCbu;
module.exports.updateAccountByCbu = updateAccountByCbu;
module.exports.deleteAccountByCbu = deleteAccountByCbu;
module.exports.getTransactionsInvolving = getTransactionsInvolving;
module.exports.createTransaction = createTransaction;
module.exports.getTransactionById = getTransactionById;
module.exports.initializeEntityApis = initializeEntityApis;
