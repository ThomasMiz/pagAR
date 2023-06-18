const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const database = require('./database');
const entityApi = require('./entityApi');
const initializeEntityApis = entityApi.initializeEntityApis;

const conf = {};

try {
    const env = dotenv.parse(fs.readFileSync('.env'));
    if (!env.SERVER_HOST)
        throw 'No server host specified';
    if (!env.DATABASE_HOSTS)
        throw 'No database hosts specified';
    if (!env.DATABASE_DATACENTER)
        throw 'No database datacenter specified';
    if (!env.DATABASE_KEYSPACE)
        throw 'No database keyspace specified';

    conf.address = env.SERVER_HOST.substring(0, env.SERVER_HOST.indexOf(':'));
    conf.port = env.SERVER_HOST.substring(env.SERVER_HOST.indexOf(':') + 1);

    conf.db_hosts = []
    env.DATABASE_HOSTS.split(',').forEach(h => conf.db_hosts.push(h.trim()));
    if (conf.db_hosts.length == 0)
        throw 'No database hosts specified';

    conf.db_datacenter = env.DATABASE_DATACENTER;
    conf.db_keyspace = env.DATABASE_KEYSPACE;
} catch (e) {
    console.error("[ERROR] Failed to parse .env file, please make a copy of .env.example, fill it, and retry.", e);
    return;
}

async function main() {
    console.info("[INFO] Connecting to database...");
    await database.connect(conf);

    console.info("[INFO] Starting up Express server...");
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use('/', require('./routes/test'));

    app.use('/api/auth', require('./auth/auth'));
    app.use('/api/accounts', require('./routes/accounts'));

    const server = app.listen(conf.port, conf.address, () => {
        console.info(`[INFO] pagAR API running at http://${conf.address}:${conf.port}/`);
    });

    const sig_handler = () => {
        console.info('[INFO] Shutting down server...')

        server.close(() => {
            console.info('[INFO] Closing database...');
            database.close();
        })
    };

    process.on('SIGTERM', sig_handler);
    process.on('SIGINT', sig_handler);

    console.info("[INFO] Initializing financial entity APIs");
    await initializeEntityApis();
};

main().catch(e => console.error("[ERROR] Exception occurred while starting server: ", e));
