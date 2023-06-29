const cassandra = require('cassandra-driver');

let client = null;

function getClientOrThrow() {
    if (!client)
        throw 'Attempted to use database when not connected';
    return client;
}

async function connect(conf) {
    const client_attempt = new cassandra.Client({
        contactPoints: conf.db_hosts,
        localDataCenter: conf.db_datacenter
    });

    await client_attempt.connect();
    console.info("[INFO] Connected to the database, creating schema if not exists...");

    await client_attempt.execute("CREATE KEYSPACE IF NOT EXISTS pagar WITH replication = {'class': 'SimpleStrategy', 'replication_factor' : 1}");
    await client_attempt.execute("USE pagar");
    await client_attempt.execute("CREATE TABLE IF NOT EXISTS users (alias TEXT PRIMARY KEY, password TEXT, cbu TEXT, first_name TEXT, last_name TEXT, date_joined TIMESTAMP);");
    await client_attempt.execute("CREATE INDEX IF NOT EXISTS users_cbu_index ON users (cbu);");
    console.info("[INFO] Database schema created");

    client = client_attempt;
}

function close() {
    const client_old = client;
    client = null;
    return client_old ? client_old.shutdown() : Promise.resolve();
}

async function createUser(alias, password, cbu, firstName, lastName) {
    const result = await getClientOrThrow().execute(
        "INSERT INTO users (alias, password, cbu, first_name, last_name, date_joined) VALUES (?, ?, ?, ?, ?, dateof(now())) IF NOT EXISTS",
        [alias, password, cbu, firstName, lastName],
        {prepare: true}
    );

    if (!result.wasApplied()) {
        console.info(`[INFO] Failed to create user with alias ${alias}: already taken`);
        throw 'Alias already taken';
    }

    console.info(`[INFO] Created user with alias ${alias} and cbu ${cbu}`);
}

async function getUsers(limit) {
    const result = await getClientOrThrow().execute(
        "SELECT alias, cbu, date_joined, first_name, last_name FROM users" + (limit ? " LIMIT ?;" : ";"),
        limit ? [limit] : [],
        {prepare: true}
    );

    return result.rows;
}

async function getUserByAlias(alias) {
    const result = await getClientOrThrow().execute(
        "SELECT * FROM users WHERE alias = ?",
        [alias],
        {prepare: true}
    );

    return result.rows.length == 0 ? null : {
        alias: result.rows[0].alias,
        cbu: result.rows[0].cbu,
        password: result.rows[0].password,
        dateJoined: result.rows[0].date_joined,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
    };
}

async function getUserByCbu(cbu) {
    const result = await getClientOrThrow().execute(
        "SELECT * FROM users WHERE cbu = ?",
        [cbu],
        {prepare: true}
    );

    return result.rows.length == 0 ? null : {
        alias: result.rows[0].alias,
        cbu: result.rows[0].cbu,
        password: result.rows[0].password,
        dateJoined: result.rows[0].date_joined,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
    };
}

module.exports.connect = connect;
module.exports.close = close;
module.exports.createUser = createUser;
module.exports.getUsers = getUsers;
module.exports.getUserByAlias = getUserByAlias;
module.exports.getUserByCbu = getUserByCbu;
