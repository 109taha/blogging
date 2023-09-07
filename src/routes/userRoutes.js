const router = require("express").Router();
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Admin = require("../model/adminSchema");
const User = require("../model/userSchema");
const { AdminJoiSchema, UserJoiSchema } = require("../helper/joi/joiSchema");
const sendResetEmail = require("../helper/nodemailer");

router.post("/create/admin", AdminJoiSchema, async (req, res) => {
  try {
    const { user_name, email, name, password, phone_number, devicetoken } =
      req.body;
    if (
      !user_name ||
      !email ||
      !name ||
      !password ||
      !phone_number ||
      !devicetoken
    ) {
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
      devicetoken,
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

router.post("/reset-password/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const password = req.body.password;

    const user = await User.findById(userId);

    if (user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: "Password reset successful" });
    }
    const staff = await Admin.findById(userId);

    if (staff) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      staff.password = hashedPassword;
      await staff.save();

      res.status(200).json({ message: "Password reset successful" });
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error: " + error.message });
  }
});

router.post("/create/user", UserJoiSchema, async (req, res) => {
  try {
    const { user_name, email, name, password, phone_number, devicetoken } =
      req.body;
    if (
      !user_name ||
      !email ||
      !name ||
      !password ||
      !phone_number ||
      !devicetoken
    ) {
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
      devicetoken,
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

// router.post("/login", async (req, res) => {
//   try {
//     const { user_name, password } = req.body;
//     if (!user_name) {
//       return res
//         .status(400)
//         .send({ success: false, message: "Kindly provide an user_name" });
//     }
//     if (!password) {
//       return res
//         .status(400)
//         .send({ success: false, message: "Kindly provide a Password" });
//     }

//     const user = await Admin.findOne({ user_name });
//     if (!user) {
//       const anotherUser = await User.findOne({ user_name });
//       if (!anotherUser) {
//         return res
//           .status(400)
//           .send({ success: false, message: "You Are Not Registered !" });
//       }
//       const validPassword = await bcrypt.compare(
//         req.body.password,
//         anotherUser.password
//       );
//       if (!validPassword) {
//         return res.status(400).send({
//           success: false,
//           message: "Maybe your Email or Password is not correct!",
//         });
//       }

//       const token = JWT.sign({ userId: anotherUser._id }, process.env.JWT_SEC);

//       return res.status(200).send({
//         success: true,
//         message: "Client login successfully",
//         token,
//         anotherUser,
//       });
//     }

//     const validPassword = await bcrypt.compare(
//       req.body.password,
//       user.password
//     );
//     if (!validPassword) {
//       return res.status(400).send({
//         success: false,
//         message: "Maybe your Email or Password is not correct!",
//       });
//     }

//     const token = JWT.sign({ userId: user._id }, process.env.JWT_SEC_ADMIN);

//     res.status(200).send({
//       success: true,
//       message: "User login successfully",
//       token,
//       user,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error: " + error.message);
//   }
// });

router.post("/login/:deviceToken", async (req, res) => {
  try {
    const { user_name, password } = req.body;
    const deviceToken = req.params.deviceToken;

    if (!user_name || !password || !deviceToken) {
      return res.status(400).json({
        success: false,
        message: "Please provide user_name, password, and deviceToken.",
      });
    }

    const admin = await Admin.findOne({ user_name });

    if (admin) {
      const validAdminPassword = await bcrypt.compare(password, admin.password);

      if (validAdminPassword) {
        admin.devicetoken = deviceToken;
        await admin.save();

        const token = JWT.sign(
          { userId: admin._id },
          process.env.JWT_SEC_ADMIN
        );

        return res.status(200).json({
          success: true,
          message: "Admin login successful",
          token,
          user: admin,
        });
      }
    }

    const user = await User.findOne({ user_name });

    if (user) {
      const validUserPassword = await bcrypt.compare(password, user.password);

      if (validUserPassword) {
        user.devicetoken = deviceToken;
        await user.save();

        const token = JWT.sign({ userId: user._id }, process.env.JWT_SEC);

        return res.status(200).json({
          success: true,
          message: "User login successful",
          token,
          user,
        });
      }
    }

    return res.status(400).json({
      success: false,
      message: "Invalid user_name or password. Please check your credentials.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.delete("/delete/user/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const deleteUser = await User.findByIdAndDelete(userId);
    if (deleteUser === null) {
      return res.status(400).send("no User found!");
    }
    res
      .status(200)
      .send({ success: false, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
