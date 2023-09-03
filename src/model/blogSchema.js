const mongoose = require("mongoose");

const BlogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      require: true,
      ref: "Admin",
    },
    data: [
      {
        ctype: {
          type: String,
          enum: ["image", "heading", "text"],
          require: true,
        },
        content: {
          type: String,
          require: true,
        },
      },
    ],
    views: {
      type: Number,
    },
  },
  { timestamps: true }
);
const Blog = mongoose.model("Blog", BlogSchema);

module.exports = Blog;
