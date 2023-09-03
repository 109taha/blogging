const router = require("express").Router();
const Blog = require("../model/blogSchema");
const cloudinary = require("../helper/cloudinary");
const upload = require("../helper/multer");
const fs = require("fs");
const { verifyAdmin } = require("../middleWares/verify");
const JWT = require("jsonwebtoken");

router.post(
  "/create/blog",
  verifyAdmin,
  upload.array("attachArtwork", 1),
  async (req, res) => {
    const files = req.files;
    const attachArtwork = [];
    try {
      if (!files || files?.length < 1)
        return res.status(401).json({
          success: false,
          message: "You have to upload at least one image to the listing",
        });

      for (const file of files) {
        const { path } = file;
        try {
          const uploader = await cloudinary.uploader.upload(path, {
            folder: "24-Karat",
          });
          attachArtwork.push({ url: uploader.url });
          fs.unlinkSync(path);
        } catch (err) {
          if (attachArtwork?.length) {
            const imgs = imgObjs.map((obj) => obj.public_id);
            cloudinary.api.delete_resources(imgs);
          }
          console.log(err);
        }
      }

      const data = JSON.parse(req.body.data);

      for (const item of data) {
        if (item.ctype === "image") {
          item.content = attachArtwork[0].url;
          break;
        }
      }
      const token = req.headers.authorization.split(" ")[1];
      const decryptedToken = JWT.verify(token, process.env.JWT_SEC_ADMIN);
      const userId = decryptedToken.userId;
      const newBlog = new Blog({
        adminId: userId,
        data: data,
      });
      await newBlog.save();
      res.status(200).send({ success: true, newBlog });
    } catch (error) {
      console.error("Error creating blog post:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/all/blogs", async (req, res) => {
  try {
    const allBlog = await Blog.find();
    if (!allBlog.length > 0) {
      return res.status(400).send("no blog found!");
    }
    res.status(200).send({ success: true, allBlog });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/one/blogs/:Id", async (req, res) => {
  try {
    const blogID = req.params.Id;
    const allBlog = await Blog.findOne({ _id: blogID });
    console.log(allBlog);
    if (allBlog === null) {
      return res.status(400).send("no blog found!");
    }
    res.status(200).send({ success: true, allBlog });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/delete/blog/:Id", async (req, res) => {
  try {
    const blogID = req.params.Id;
    const allBlog = await Blog.findOneAndDelete({ _id: blogID });
    if (allBlog === null) {
      return res.status(400).send("no blog found!");
    }
    res
      .status(200)
      .send({ success: true, message: "Blog deleted successfully!" });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
module.exports = router;
