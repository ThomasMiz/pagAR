const Joi = require('joi')
const cbuUtils = require('../cbuUtils');
const {aliasRegex} = require('../auth/forms');

function cbuOrAliasValidator(value, helpers) {
    let cbuOrAlias = value.toString().toLowerCase();
    if (cbuOrAlias[0] >= 'a' && cbuOrAlias[0] <= 'z') {
        if (!cbuOrAlias.match(aliasRegex))
            return helpers.error("any.invalid");
    } else if (cbuOrAlias[0] >= '0' && cbuOrAlias[0] <= '9') {
        if (!cbuOrAlias.match(/^[0-9]{22}$/) || !cbuUtils.isValid(cbuOrAlias))
            return helpers.error("any.invalid");
    } else {
        return helpers.error("any.invalid");
    }

    return cbuOrAlias;
}

const cbuOrAliasSchema = Joi.object({
    cbuOrAlias: Joi.string().custom(cbuOrAliasValidator, 'Must be a CBU or alias').required()
});

function cbuOrAliasForm(data) {
    return cbuOrAliasSchema.validate(data);
}

const getTransactionsSchema = Joi.object({
    page: Joi.number().min(1).precision(0).optional(),
    size: Joi.number().min(1).precision(0).optional(),

    start: Joi.string().isoDate().optional(),
    end: Joi.string().isoDate().optional()
});

function getTransactionsForm(data) {
    return getTransactionsSchema.validate(data);
}

const createTransactionSchema = Joi.object({
    destination: Joi.string().custom(cbuOrAliasValidator, 'Must be a CBU or alias').required(),

    amount: Joi.string().required(),
    motive: Joi.string().trim().optional()
});

function createTransactionForm(data) {
    return createTransactionSchema.validate(data);
}

module.exports.getTransactionsForm = getTransactionsForm;
module.exports.cbuOrAliasForm = cbuOrAliasForm;
module.exports.createTransactionForm = createTransactionForm;
