try {
    module.exports = require('fs').readFileSync('secret.txt');
} catch (e) {
    console.warn("[WARNING] Couldn't read JWT secret key from secret.txt. Authentication is not secure!", e);
    module.exports = "f";
}
