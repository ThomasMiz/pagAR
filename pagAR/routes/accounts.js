const router = require('express').Router();
const userAuthenticated = require('../middleware');

router.get('/', userAuthenticated, (req, res) => {
    let accounts = [{alias: "pedro.mcpedro", cbu: "0010069400000000004200", firstName: "pedro", lastName: "mcpedro"}];
    res.send(accounts)
})

module.exports = router;
