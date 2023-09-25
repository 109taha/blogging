const router = require("express").Router();
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Admin = require("../model/adminSchema");
const User = require("../model/userSchema");
const { AdminJoiSchema, UserJoiSchema } = require("../helper/joi/joiSchema");
const sendResetEmail = require("../helper/nodemailer");
const { verifyUser } = require("../middleWares/verify");

router.post("/create/admin", AdminJoiSchema, async (req, res) => {
  try {
    const { email, name, password, phone_number, devicetoken } =
      req.body;
    if ( !email || !name || !password || !phone_number) {
      return res.status(400).send("you have to provide all of the felid");
    }
    const exisitUser = await Admin.findOne({ email });
    if (exisitUser) {
      return res.status(400).send("User already register, goto login page");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log(hashedPassword);

    const newAdmin = new Admin({
      email,
      name,
      password: hashedPassword,
      phone_number,
      devicetoken,
    });

    await newAdmin.save();
    res
      .status(200)
      .send({ success: true, message: "Admin registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.post("/saved/blog", verifyUser, async (req, res) => {
  try {
    const user = req.user;
    const savedBlog = req.body.savedBlog;

    const userFromDB = await User.findById(user);
    if (!userFromDB) {
      return res.status(404).send("User not found");
    }
    if (userFromDB.savedBloged.includes(savedBlog)) {
      // return res.status(400).send("Blog already saved");

      userFromDB.savedBloged = userFromDB.savedBloged.filter(
        (item) => item.toString() != savedBlog
      );

      await userFromDB.save();

      return res.status(200).send("Blog unsaved successfully");
    }

    userFromDB.savedBloged.push(savedBlog);

    await userFromDB.save();

    return res.status(200).send("Blog saved successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.get("/saved/blogs", verifyUser, async (req, res) => {
  try {
    const user = req.user;

    const userWithBlogs = await User.findById(user).populate({path: "savedBloged", select:"title featureImg createdAt", populate:{path: "categories", select: "name" }});
    if (!userWithBlogs) {
      return res.status(404).send("User not found");
    }
    const blogged = userWithBlogs.savedBloged;
    return res.status(200).json(blogged);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.post("/forgot-password/admin", async (req, res) => {
  try {
    const email = req.body.email;

    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(400).send("No Admin found on that email");
    }
    const token = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    console.log(token);
    sendResetEmail(email, token);
    res.json({
      success: true,
      message: "Check your email for the verification code.",
      token,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Internal Server Error: " + error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const email = req.body.email;

    const staff = await User.findOne({ email });
    if (!staff) {
      return res.status(400).send("no User found on that email");
    }
    const token = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    console.log(token);
    sendResetEmail(email, token);
    res.send({
      success: true,
      message: "Check your email for the verification code.",
      token,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ message: "Internal Server Error: " + error.message });
  }
});

router.post("/reset-password/:email", async (req, res) => {
  try {
    const userEmail = req.params.email;
    const password = req.body.password;

    let user = await User.findOne({email: userEmail});
    if (user) {
      console.log(user.password)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      user.password = hashedPassword;
      user = await user.save();
      console.log(user.password)

      res.status(200).send({ message: "Password reset successful" });
    }
    const staff = await Admin.findOne({email: userEmail});

    if (staff) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      staff.password = hashedPassword;
      await staff.save();

      res.status(200).send({ message: "Password reset successful" });
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
    const {  email, name, password, phone_number, devicetoken } =
      req.body;
    if (!email || !name || !password || !phone_number) {
      return res.status(400).send("you have to provide all of the field");
    }
    const exisitUser = await User.findOne({ email });
    if (exisitUser) {
      return res.status(400).send("User already register, goto login page");
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const newUser = new User({
      email,
      name,
      password: hashedPassword,
      phone_number,
      devicetoken,
    });

    await newUser.save();
    res
      .status(200)
      .send({ success: true, message: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const { email, name, password, phone_number, devicetoken } =
      req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send("User not found");
    }
    user.email = email || user.email;
    user.name = name || user.name;
    user.phone_number = phone_number || user.phone_number;
    user.devicetoken = devicetoken || user.devicetoken;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user.password = hashedPassword;
    }

    await user.save();
    res.status(200).send({ message: "User updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error: " + error.message);
  }
});

router.get("/find/user", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    let sortBY = {"createdAt": -1}
    if(req.query.sort){
      sortBY = JSON.parse(req.query.sort) 

    }

    const total = await User.countDocuments();
    const AllUser = await User.find()
      .skip(skip)
      .limit(limit)
      .sort(sortBY)

    if (!AllUser.length > 0) {
      return res.status(400).send("No user found!");
    }
    const totalPages = Math.ceil(total / limit);
    res.status(200).send({ success: true, AllUser, page, totalPages, limit, total });
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password.",
      });
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).send("No admin found on that email");
    }
    const validAdminPassword = await bcrypt.compare(password, admin.password);

    if (validAdminPassword) {
      const token = JWT.sign({ userId: admin._id }, process.env.JWT_SEC_ADMIN);

      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        token,
        user: admin,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.post("/login/user", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, password.",
      });
    }
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send("Invalid Email!");
    }
    const validUserPassword = await bcrypt.compare(password, user.password);

    if (validUserPassword) {
      const token = JWT.sign({ userId: user._id }, process.env.JWT_SEC);

      return res.status(200).json({
        success: true,
        message: "User login successful",
        token,
        user,
      });
    }
    return res.status(400).send("Invalid email or password!")
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

router.get("/search/user/:name", async (req, res, next) => {
  try {
    const searchfield = req.params.name;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    

    const user = await User.find({name: { $regex: searchfield, $options: "i" }})
      .skip(skip)
      .limit(limit)
      .countDocuments()
      
    // const totalPages = Math.ceil(total / limit);
    const item = { user };
    res.status(200).send({data: item, page, limit, total });
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
