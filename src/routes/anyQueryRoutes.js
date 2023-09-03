const Query = require("../model/anyQuerySchema");
const router = require("express").Router();
const { verifyUser } = require("../middleWares/verify");
const JWT = require("jsonwebtoken");
const User = require("../model/userSchema");

router.post("/create/query", verifyUser, async (req, res) => {
  try {
    const userId = req.user;
    const user = await User.findById(userId);
    const query = req.body;
    console.log(query);
    if (Object.keys(query).length == 0) {
      return res.status(400).send("you have to send any qury");
    }
    const newQuery = new Query({
      userId,
      name: user.name,
      email: user.email,
      query,
    });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
