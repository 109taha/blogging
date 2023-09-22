const router = require("express").Router();
const Blog = require("../model/blogSchema");
const cloudinary = require("../helper/cloudinary");
const upload = require("../helper/multer");
const fs = require("fs");
const { verifyAdmin } = require("../middleWares/verify");
const JWT = require("jsonwebtoken");
const User = require("../model/userSchema");
const Categories = require("../model/blogCategories");
var FCM = require('fcm-node');
var serverKey = process.env.SERVERKEY
var fcm = new FCM(serverKey);

const sendNotification = async (title, body, deviceToken, ID) => {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    to: deviceToken,
    data: {  
      my_key: ID,
  }
  };
      
  fcm.send(message, function(err, response){
    if (err) {
        console.log("Something has gone wrong!");
    } else {
        console.log("Successfully sent with response: ", response);
    }
})
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
            attachArtwork.push();
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
          .send("you have to provide Name and Description!");
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

router.put(
  "/update/category/:categoryId",
  verifyAdmin,
  upload.array("attachArtwork", 1),
  async (req, res) => {
    const files = req.files;
    const attachArtwork = [];

    try {
      if (files && files.length > 0) {
        for (const file of files) {
          const { path } = file;
          try {
            const uploader = await cloudinary.uploader.upload(path, {
              folder: "blogging",
            });
            attachArtwork.push({ url: uploader.url });
            fs.unlinkSync(path);
          } catch (err) {
            if (attachArtwork.length > 0) {
              const imgs = attachArtwork.map((obj) => obj.public_id);
              cloudinary.api.delete_resources(imgs);
            }
            console.log(err);
          }
        }
      }
      
      const categoryId = req.params.categoryId
      const { name, description } = req.body;
      
      const categoryUpdated = await Categories.findById(categoryId);
       console.log(categoryUpdated)

      if (!categoryUpdated || categoryUpdated <= 0) {
        return res.status(200).send(`no category found`);
      }
      
      categoryUpdated.name = name || categoryUpdated.name,
      categoryUpdated.description = description || categoryUpdated.description,
      categoryUpdated.img = attachArtwork.length > 0 ? attachArtwork[0].url : categoryUpdated.img;
      
      console.log(categoryUpdated) 
      await categoryUpdated.save();
      res.status(200).send({ message: "Category updated Successfully" });
    } catch (error) {
      console.error("Error creating blog post:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/all/category", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const total = await Categories.countDocuments();

    const allCategory = await Categories.find().sort({ createdAt: -1 });

    if (!allCategory.length > 0) {
      return res.status(404).send("No Category found");
    }

    const totalPages = Math.ceil(allCategory.length / limit);

    res.status(200).send({
      success: true,
      allCategory,
      total,
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/one/category/:categoryId", async (req, res) => {
  try {
    const categoryId = req.params.categoryId

    const category = await Categories.findById(categoryId)

    if (category == null ) {
      return res.status(404).send("No Category found");
    }

    res.status(200).send({
      success: true,
      category
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/blog/category", async (req, res) => {
  try {
    const categorys = req.body.category;
    const allBlog = await Blog.find({ categories: [categorys] });
    if (!allBlog.length > 0) {
      return res.status(404).send(`No Blog found on ${categorys} category`);
    }

    res.status(200).send({
      success: true,
      allBlog,
    });
  } catch (error) {
    console.error("Error retrieving categories:", error);
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
  upload.array("featureImg", 1),
  async (req, res) => {
    // try {
    //   const files = req.files;
    //   const attachArtwork = [];
    //   if (!files || files?.length < 1)
    //     return res.status(401).json({
    //       success: false,
    //       message: "You have to upload at least one image to the listing",
    //     });
    //   for (const fileArray in files) {
    //     for (const file in files[fileArray]) {
    //       try {
    //         const uploader = await cloudinary.uploader.upload(
    //           files[fileArray][file].path,
    //           {
    //             folder: "Blogging",
    //           }
    //         );
    //         attachArtwork.push({ url: uploader.url, type: fileArray });
    //         fs.unlinkSync(files[fileArray][file].path);
    //       } catch (err) {
    //         if (attachArtwork?.length) {
    //           const imgs = attachArtwork.map((obj) => obj.public_id);
    //           cloudinary.api.delete_resources(imgs);
    //         }
    //         console.log(err);
    //       }
    //     }
    //   }
    const files = req.files;
    const featureImg = [];

    try {
      if (!files || files?.length < 1) {
      } else {
        for (const file of files) {
          const { path } = file;
          try {
            const uploader = await cloudinary.uploader.upload(path, {
              folder: "blogging",
            });
            featureImg.push({ url: uploader.url });
            fs.unlinkSync(path);
          } catch (err) {
            if (featureImg?.length) {
              const imgs = imgObjs.map((obj) => obj.public_id);
              cloudinary.api.delete_resources(imgs);
            }
            console.log(err);
          }
        }
      }
      if (featureImg.length <= 0){
        return res.status(400).send("you have to add feature Image")
      }
      const data = JSON.parse(req.body.data);
      const { titles, categories } = req.body;
      if (!titles || !categories) {
        return res
          .status(400)
          .send("you have to add title and category of the blog");
      }
   
      // const featureImgMain = attachArtwork[0].url;
      // attachArtwork.shift();

      // let attachArtworkCount = 0;
      // console.log(attachArtwork);
      // for (let testIndex = 0; testIndex < data.length; testIndex++) {
      //   if (data[testIndex].ctype == "image") {
      //     if (attachArtworkCount < attachArtwork.length) {
      //       data[testIndex].content = attachArtwork[attachArtworkCount].url;
      //       attachArtworkCount++;
      //     } else {
      //       console.error(
      //         "Not enough elements in attachArtwork to cover all images."
      //       );
      //       break;
      //     }
      //   }
      // }

      const userId = req.user;
      const newBlog = new Blog({
        adminId: userId,
        featureImg: featureImg[0].url,
        title: titles,
        data: data,
        categories,
      });
      await newBlog.save();
      const user = await User.find();
      let tokendeviceArray = [];
      for (let index = 0; index < user.length; index++) {
        const element = user[index];
        element.devicetoken == undefined
          ? " "
          : tokendeviceArray.push(element.devicetoken);
      }
      const newdeviceToken = tokendeviceArray.filter((item, index) => tokendeviceArray.indexOf(item) === index)
      const title = "New Blog Post";
      const body = `${newBlog.title}`;
      const deviceToken = newdeviceToken;
      const ID = newBlog._id
      deviceToken.length > 0 && deviceToken.forEach(eachToken => {
        sendNotification(title, body, eachToken, ID )
      });;
      
      
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
  upload.array("featureImg", 1),
  async (req, res) => {
    const blogId = req.params.blogId;

    const files = req.files;
    const featureImg = [];

    try {
      if (files && files.length > 0) {
        for (const file of files) {
          const { path } = file;
          try {
            const uploader = await cloudinary.uploader.upload(path, {
              folder: "blogging",
            });
            featureImg.push({ url: uploader.url });
            fs.unlinkSync(path);
          } catch (err) {
            if (featureImg.length > 0) {
              const imgs = featureImg.map((obj) => obj.public_id);
              cloudinary.api.delete_resources(imgs);
            }
            console.log(err);
          }
        }
      }
      const { titles, data, categories } = req.body;
       const newData = !data==undefined? JSON.parse(data): null
      const updateBlog = await Blog.findById(blogId);
      if (!updateBlog) {
        return res.status(404).json({ error: "Blog not found" });
      }
      updateBlog.featureImg = featureImg.length > 0 ? featureImg[0].url : updateBlog.featureImg;
      updateBlog.title = titles || updateBlog.title;
      updateBlog.data = newData || updateBlog.data;
      updateBlog.categories = categories || updateBlog.categories;
       
      await updateBlog.save();

      res.status(200).send({ success: true, updateBlog });
    } catch (error) {
      console.error("Error updating blog post:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

router.get("/all/blogs", async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const total = await Blog.countDocuments();

    const allBlog = await Blog.find()
      .populate({ path: "categories", select: "name" })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select("title featureImg createdAt");
    console.log(allBlog);

    if (!allBlog.length > 0) {
      return res.status(400).send("no blog found!");
    }

    const totalPages = Math.ceil(total / limit);

    res
      .status(200)
      .send({ success: true, data: allBlog, page, totalPages, limit, total });
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
    ).populate("categories");

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
    }).select("featureImg title createdAt");
    console.log(blog);
    const item = { blog };
    res.status(200).send(item);
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
});

router.get("/search/blog/category/:category", async (req, res, next) => {
  try {
    const searchfield = req.params.category;
    const blog = await Blog.find({
      categories: searchfield
    }).select("featureImg title createdAt").populate({path: "categories", select: "name"})
    const item = { blog };
    res.status(200).send(item);
  } catch (error) {
    res.status(500).send({ message: "Internal server error" });
  }
});

module.exports = router;
