const router = require('express').Router()

router.get('/', (req, res) => {
    res.send({welcome: "Buenos Días :)"});
});

router.post('/', (req, res) => {
    res.send({welcome: "Buenos Noches :)"});
});

module.exports = router;
