const router = require("express").Router();
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Admin = require("../model/adminSchema");
const User = require("../model/userSchema");

router.post("/create/admin", async (req, res) => {
  try {
    const { user_name, email, name, password, phone_number } = req.body;
    if (!user_name || !email || !name || !password || !phone_number) {
      return res.status(400).send("you have to provide all of the feild");
    }
    const exisitUser = await Admin.findOne({ email });
    const exisitingUser = await Admin.findOne({ user_name });
    if (exisitUser) {
      return res.status(400).send("User already register, goto login page");
    }
    if (exisitingUser) {
      return res.status(400).send("Username already exist, try another");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword);

    const newAdmin = new Admin({
      user_name,
      email,
      name,
      password: hashedPassword,
      phone_number,
    });

    await newAdmin.save();
    res
      .status(200)
      .send({ success: true, message: "Admin registerd successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.post("/create/user", async (req, res) => {
  try {
    const { user_name, email, name, password, phone_number } = req.body;
    if (!user_name || !email || !name || !password || !phone_number) {
      return res.status(400).send("you have to provide all of the feild");
    }
    const exisitUser = await User.findOne({ email });
    const exisitingUser = await User.findOne({ user_name });
    if (exisitUser) {
      return res.status(400).send("User already register, goto login page");
    }
    if (exisitingUser) {
      return res.status(400).send("Username already exist, try another");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      user_name,
      email,
      name,
      password: hashedPassword,
      phone_number,
    });

    await newUser.save();
    res
      .status(200)
      .send({ success: true, message: "User registerd successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.get("/find/user", async (req, res) => {
  try {
    const AllUser = await User.find();
    if (!AllUser.length > 0) {
      return res.status(400).send("No user found!");
    }
    res.status(200).send({ success: true, AllUser });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.get("/find/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(400).send("No user found!");
    }
    res.status(200).send({ success: true, user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.post("/login", async (req, res) => {
  try {
    const { user_name, password } = req.body;
    if (!user_name) {
      return res
        .status(400)
        .send({ success: false, message: "Kindly provide an user_name" });
    }
    if (!password) {
      return res
        .status(400)
        .send({ success: false, message: "Kindly provide a Password" });
    }

    const user = await Admin.findOne({ user_name });
    if (!user) {
      const anotherUser = await User.findOne({ user_name });
      if (!anotherUser) {
        return res
          .status(400)
          .send({ success: false, message: "You Are Not Registered !" });
      }
      const validPassword = await bcrypt.compare(
        req.body.password,
        anotherUser.password
      );
      if (!validPassword) {
        return res.status(400).send({
          success: false,
          message: "Maybe your Email or Password is not correct!",
        });
      }

      const token = JWT.sign({ userId: anotherUser._id }, process.env.JWT_SEC);

      return res.status(200).send({
        success: true,
        message: "Client login successfully",
        token,
        anotherUser,
      });
    }

    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      return res.status(400).send({
        success: false,
        message: "Maybe your Email or Password is not correct!",
      });
    }

    const token = JWT.sign({ userId: user._id }, process.env.JWT_SEC_ADMIN);

    res.status(200).send({
      success: true,
      message: "User login successfully",
      token,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

module.exports = router;
