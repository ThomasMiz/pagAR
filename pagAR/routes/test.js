const router = require('express').Router()

router.get('/', (req, res) => {
    res.send({welcome: "Buenos Días :)"});
});

module.exports = router;
