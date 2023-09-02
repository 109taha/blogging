const router = require("express").Router();
const Blog = require("../model/blogSchema");
const cloudinary = require("../helper/cloudinary");
const upload = require("../helper/multer");
const fs = require("fs");
const { verifyAdmin } = require("../middleWares/verify");
const JWT = require("jsonwebtoken");

// router.post(
//   "/create/blog",
//   verifyAdmin,
//   upload.single("Images"),
//   async (req, res) => {
//     try {
//       const file = req.file;
//       const Images = [];
//       if (Images) {
//         const path = file;
//         const uploader = await cloudinary.uploader.upload(path, {
//           folder: "24-Karat",
//         });
//         Images.push({ url: uploader.url });
//         fs.unlinkSync(file.path);
//         if (Images?.length) {
//           const imgs = imgObjs.map((obj) => obj.public_id);
//           cloudinary.api.delete_resources(imgs);
//         }
//       }

//       const token = req.headers.authorization.split(" ")[1];
//       const decryptedToken = JWT.verify(token, process.env.JWT_SEC_ADMIN);

//       const userId = decryptedToken.userId;
//       const data = req.body;
//       if (!data) {
//         return res.status(400).send("you have to upload Data of Blog");
//       }
//       const newBlog = new Blog({
//         adminId: userId,
//         data,
//       });
//       console.log(newBlog);
//     } catch (error) {
//       console.error(error);
//       res.status(500).send("Internal Server Error: " + error.message);
//     }
//   }
// );

// router.post("/create/blog", upload.single("image"), async (req, res) => {
//   try {
//     const { ctype, content } = req.body;
//     let imageUrl = null;

//     // Check if an image was uploaded
//     if (req.file) {
//       // Upload the image to Cloudinary
//       const result = await cloudinary.uploader.upload(req.file.buffer, {
//         folder: "blog-images", // Change to your desired folder name
//       });

//       imageUrl = result.secure_url;
//     }

//     // Create a new blog post with the data
//     const blogPost = new Blog({
//       ctype,
//       content,
//       image: imageUrl,
//     });

//     // Save the blog post to the database
//     await blogPost.save();

//     return res
//       .status(201)
//       .json({ message: "Blog post created successfully", blogPost });
//   } catch (error) {
//     console.error("Error creating blog post:", error);
//     return res.status(500).json({ error: "Internal server error" });
//   }
// });

router.post(
  "/create/blog",
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
      const data = req.body;
      if (data.length > 0 && data[0].ctype === "image") {
        if (attachArtwork && attachArtwork.length > 0) {
          data[0].content = attachArtwork[0].url;
        } else {
          return res.status(400).send("1st object is not image");
        }
      }
    } catch (error) {
      console.error("Error creating blog post:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

module.exports = router;
