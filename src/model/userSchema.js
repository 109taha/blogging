const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    user_name: {
      type: String,
      unique: true,
      trim: true,
      require: true,
      lowercase: true,
    },
    email: {
      type: String,
      trim: true,
      require: true,
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },
    name: {
      type: String,
      require: true,
    },
    password: {
      type: String,
      trim: true,
      require: true,
    },
    phone_number: {
      type: Number,
      trim: true,
      require: true,
    },
    devicetoken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);
const User = mongoose.model("User", UserSchema);

module.exports = User;
