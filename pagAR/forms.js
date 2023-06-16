const Joi = require('joi')
const cbu = require('./cbu');

const registerSchema = Joi.object({
    alias: Joi.string().min(6).max(20).pattern(/^[0-9a-z\.-]+$/).required(),

    password: Joi.string().min(8).required(),

    cbu: Joi.string().length(22).custom(cbu.isValid, 'Verification digits match'),

    firstName: Joi.string().min(6).max(20).pattern(/^[0-9a-z\.-]+$/).required(),
    lastName: Joi.string().min(6).max(20).pattern(/^[0-9a-z\.-]+$/).required(),
});

function registerForm(data) {
    return registerSchema.validate(data);
}

const loginSchema = Joi.object({
    alias: Joi.string().min(6).max(20).pattern(/^[0-9a-z\.-]+$/).required(),

    password: Joi.string().min(8).required(),
});

function loginForm(data) {
    return loginSchema.validate(data);
}


module.exports.registerForm = registerForm
module.exports.loginForm = loginForm
