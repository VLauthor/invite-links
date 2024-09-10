import Joi from "joi";

export const registerSchema = Joi.object({
  lastName: Joi.string().min(2).required(),
  firstName: Joi.string().min(2).required(),
  patronymic: Joi.string().min(2),
  phone: Joi.number().integer().min(79000000000).max(89999999999).required(),
  mail: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  urlInvite: Joi.string().required(),
});

export const loginSchema = Joi.object({
  mail: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const paySchema = Joi.object({
  id: Joi.number().required(),
  number: Joi.number().min(1000000000000000).max(9999999999999999).required(),
  date: Joi.date().required(),
  svv: Joi.number().min(1).max(999).required(),
});
