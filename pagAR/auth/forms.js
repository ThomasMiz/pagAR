const Joi = require('joi')
const cbuUtils = require('../cbuUtils');

function cbuDigitsValidator(value, helpers) {
    if (cbuUtils.isValid(value))
        return value;
    return helpers.error('any.invalid');
}

const alias_regex = /^[a-z][0-9a-z\.-]{5,19}$/;

const registerSchema = Joi.object({
    alias: Joi.string().min(6).max(20).pattern(alias_regex).lowercase().required(),

    password: Joi.string().min(8).required(),

    cbu: Joi.string().length(22).custom(cbuDigitsValidator, 'Verification digits match'),

    firstName: Joi.string().min(3).max(20).pattern(/^[0-9\.\-A-Za-záéíóú]+$/).required(),
    lastName: Joi.string().min(3).max(20).pattern(/^[0-9\.\-A-Za-záéíóú]+$/).required(),
});

function registerForm(data) {
    return registerSchema.validate(data);
}

const loginSchema = Joi.object({
    alias: Joi.string().min(6).max(20).pattern(alias_regex).lowercase().required(),

    password: Joi.string().min(8).required(),
});

function loginForm(data) {
    return loginSchema.validate(data);
}


module.exports.registerForm = registerForm
module.exports.loginForm = loginForm
