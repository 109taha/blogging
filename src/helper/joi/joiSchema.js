const Joi = require("joi");

const AdminSchema = Joi.object({
  user_name: Joi.string().required(),
  name: Joi.string().required(),
  phone_number: Joi.number().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
  devicetoken: Joi.string().required(),
});

const AdminJoiSchema = (req, res, next) => {
  const { error } = AdminSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error });
  } else {
    next();
  }
};

const UserSchema = Joi.object({
  user_name: Joi.string().required(),
  name: Joi.string().required(),
  phone_number: Joi.number().required(),
  email: Joi.string().required(),
  password: Joi.string().required(),
});

const UserJoiSchema = (req, res, next) => {
  const { error } = UserSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error });
  } else {
    next();
  }
};

module.exports = { AdminJoiSchema, UserJoiSchema };
