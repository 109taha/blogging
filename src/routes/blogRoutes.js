const router = require("express").Router();
const Blog = require("../model/blogSchema");
const cloudinary = require("../helper/cloudinary");
const upload = require("../helper/multer");
const fs = require("fs");
const { verifyAdmin } = require("../middleWares/verify");
const JWT = require("jsonwebtoken");
const admin = require("firebase-admin");
const User = require("../model/userSchema");
const Categories = require("../model/blogCategories");

const serviceAccount = require("../../blogging-10898-firebase-adminsdk-7g07k-3621afe093.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendNotification = async (title, body, deviceToken) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: deviceToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent FCM message:", response);
  } catch (error) {
    console.error("Error sending FCM message:", error);
  }
};

router.post(
  "/create/category",
  verifyAdmin,
  upload.array("attachArtwork", 1),
  async (req, res) => {
    const files = req.files;
    const attachArtwork = [];

    try {
      if (!files || files?.length < 1) {
      } else {
        for (const file of files) {
          const { path } = file;
          try {
            const uploader = await cloudinary.uploader.upload(path, {
              folder: "blogging",
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
      }

      const { name, description } = req.body;
      if (!name || !description) {
        return res
          .status(404)
          .send({ message: "you have to provide Name and Description!" });
      }
      const alreadyCreated = await Categories.findOne({ name: req.body.name });
      if (alreadyCreated) {
        return res.status(200).send(`You already created ${name} Category`);
      }
      const newCategory = new Categories({
        name,
        description,
        img: attachArtwork[0].url,
      });
      await newCategory.save();
      res.status(200).send({ message: "Category Add Successfully" });
    } catch (error) {
      console.error("Error creating blog post:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/all/category", async (req, res) => {
  try {
    const allCategory = await Categories.find();
    if (!allCategory.length > 0) {
      return res.status(404).send("no Category found");
    }
    res.status(200).send({ success: true, allCategory });
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/delete/category/:id", verifyAdmin, async (req, res) => {
  try {
    const categoryId = req.params.id;
    const deletedCategory = await Categories.findByIdAndDelete(categoryId);
    res.status(200).send("Category deleted successfully");
  } catch (error) {
    console.error("Error creating blog post:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post(
  "/create/blog",
  verifyAdmin,
  upload.fields([
    { name: "featureImg", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const files = req.files;
      const attachArtwork = [];
      if (!files || files?.length < 1)
        return res.status(401).json({
          success: false,
          message: "You have to upload at least one image to the listing",
        });
      for (const fileArray in files) {
        for (const file in files[fileArray]) {
          try {
            const uploader = await cloudinary.uploader.upload(
              files[fileArray][file].path,
              {
                folder: "Blogging",
              }
            );
            attachArtwork.push({ url: uploader.url, type: fileArray });
            fs.unlinkSync(files[fileArray][file].path);
          } catch (err) {
            if (attachArtwork?.length) {
              const imgs = imgObjs.map((obj) => obj.public_id);
              cloudinary.api.delete_resources(imgs);
            }
            console.log(err);
          }
        }
      }

      const data = JSON.parse(req.body.data);
      const { titles, categories } = req.body;

      const categoryName = await Categories.findById(categories);

      const featureImgMain = attachArtwork[0].url;

      attachArtwork.shift();

      let attachArtworkCount = 0;

      for (let testIndex = 0; testIndex < data.length; testIndex++) {
        if (data[testIndex].ctype == "image") {
          data[testIndex].content = attachArtwork[attachArtworkCount].url;
          attachArtworkCount++;
        }
      }

      const userId = req.user;
      const newBlog = new Blog({
        adminId: userId,
        featureImg: featureImgMain,
        title: titles,
        data: data,
        categories: categoryName.name,
      });
      await newBlog.save();
      const user = await User.find();

      let tokendeviceArray = [];
      for (let index = 0; index < user.length; index++) {
        const element = user[index];

        tokendeviceArray.push(element.devicetoken);
      }

      const title = "New Blog Post";
      const body = "Check out our latest blog post!";
      const deviceToken = tokendeviceArray;
      // sendNotification(title, body, deviceToken);

      res.status(200).json({ success: true, newBlog });
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.put(
  "/update/blog/:blogId",
  verifyAdmin,
  upload.array("attachArtwork", 1),
  async (req, res) => {
    const blogId = req.params.blogId;

    const files = req.files;
    const attachArtwork = [];
    try {
      if (!files || files?.length < 1) {
      } else {
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
      }

      const data = JSON.parse(req.body.data);

      for (const item of data) {
        if (item.ctype === "image" && attachArtwork.length > 0) {
          item.content = attachArtwork[0].url;
          break;
        }
      }

      const updatedBlog = await Blog.findByIdAndUpdate(
        blogId,
        { $set: { data } },
        { new: true }
      );

      res.status(200).send({ success: true, updatedBlog });
    } catch (error) {
      console.error("Error updating blog post:", error);
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
    const updatedBlog = await Blog.findOneAndUpdate(
      { _id: blogID },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!updatedBlog) {
      return res.status(400).send("No blog found!");
    }

    res.status(200).send({ success: true, updatedBlog });
  } catch (error) {
    console.error("Error updating blog view count:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/delete/blog/:Id", verifyAdmin, async (req, res) => {
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

router.get("/search/blog/:title", async (req, res, next) => {
  try {
    const searchfield = req.params.title;
    const blog = await Blog.find({
      title: { $regex: searchfield, $options: "i" },
    });
    const item = { blog };
    res.status(200).send(item);
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
