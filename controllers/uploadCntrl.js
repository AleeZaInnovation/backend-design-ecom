const fs = require("fs");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const
  cloudinary
    = require("../utils/cloudinary");
// exports.uploadImages = catchAsyncErrors(async (req, res) => {
//   try {
//     const uploader = (path) => cloudinaryUploadImg(path, "images");
//     const urls = [];
//     const files = req.files;
//     for (const file of files) {
//       const { path } = file;
//       const newpath = await uploader(path);
//       urls.push(newpath);
//       fs.unlinkSync(path);
//     }
//     const images = urls.map((file) => {
//       return file;
//     });
//     res.json(images);
//   } catch (error) {
//     throw new Error(error);
//   }
// });
exports.deleteImages = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = cloudinary(id, "images");
    res.json({ message: "Deleted" });
  } catch (error) {
    throw new Error(error);
  }
});

exports.newImages = catchAsyncErrors(async (req, res) => {
  const result = await cloudinary.uploader.upload(req.file, {
    folder: 'products',
  });

  const image = req.body.images = [
    {
      public_id: result.public_id,
      url: result.secure_url,
    },
  ];

  res.status(201).json({
    success: true,
    image,
  });

});