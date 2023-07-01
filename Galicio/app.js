const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose')

const conf = {};

try {
    const env = dotenv.parse(fs.readFileSync('.env'));
    if (!env.SERVER_HOST)
        throw 'No server host specified';
    if (!env.DATABASE_HOSTS)
        throw 'No database hosts specified';
    if (!env.DATABASE_NAME)
        throw 'No database name specified';

    // conf.mongo_uri = `mongodb://${env.DATABASE_HOSTS}/${env.DATABASE_NAME}?replicaSet=rs`
    conf.mongo_uri = `mongodb://${env.DATABASE_HOSTS}/${env.DATABASE_NAME}`
    conf.address = env.SERVER_HOST.substring(0, env.SERVER_HOST.indexOf(':'));
    conf.port = env.SERVER_HOST.substring(env.SERVER_HOST.indexOf(':') + 1);

    conf.db_hosts = []
    env.DATABASE_HOSTS.split(',').forEach(h => conf.db_hosts.push(h.trim()));
    if (conf.db_hosts.length == 0)
        throw 'No database hosts specified';
} catch (e) {
    console.error("[ERROR] Failed to parse .env file, please make a copy of .env, fill it, and retry.", e);
    return;
}

async function main() {

    console.info("[INFO] Connecting to mongoDB...");
    try{
        await mongoose.connect(conf.mongo_uri);
    } catch(e) {
        console.error(e)
    }

    console.info("[INFO] Starting up Express server...");
    const app = express();

    app.use(express.static('static'));

    app.use(express.json());

    app.use('/api/accounts', require('./routes/accounts'));

    const server = app.listen(conf.port, conf.address, () => {
        console.info(`[INFO] pagAR API running at http://${conf.address}:${conf.port}/`);
    });

    const sig_handler = () => {
        console.info('[INFO] Shutting down server...')

        server.close(() => {
            console.info('[INFO] Closing database...');
            //database.close();
        })
    };

    process.on('SIGTERM', sig_handler);
    process.on('SIGINT', sig_handler);
};

main().catch(e => console.error("[ERROR] Exception occurred while starting server: ", e));
