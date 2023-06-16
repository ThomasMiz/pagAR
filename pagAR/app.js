const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const conf = {};

try {
    const env = dotenv.parse(require('fs').readFileSync('.env'));
    conf.address = env.SERVER_HOST.substring(0, env.SERVER_HOST.indexOf(':'));
    conf.port = env.SERVER_HOST.substring(env.SERVER_HOST.indexOf(':') + 1);
} catch (e) {
    console.warn("[WARNING] Failed to parse .env file, running on default settings!", e);
    conf.address = "127.0.0.1";
    conf.port = 8080;
}

const app = express();

app.use(cors());
app.use(express.json());

app.use('/', require('./routes/test'));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/accounts', require('./routes/accounts'));

try {
    app.listen(conf.port, conf.address, () => {
        console.log(`pagAR API running at http://${conf.address}:${conf.port}/`);
    });
} catch (e) {
    console.log("Failed to start server: ", e);
}
