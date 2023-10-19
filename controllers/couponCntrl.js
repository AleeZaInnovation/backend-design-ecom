const catchAsyncErrors = require("../middlewares/catchAsyncErrors.js");
const Coupon = require("../models/couponModel.js");
const validateMongoDbId = require("../utils/validateMongodbId.js");

exports.createCoupon = catchAsyncErrors(async (req, res) => {
  try {
    const newCoupon = await Coupon.create(req.body);
    res.json(newCoupon);
  } catch (error) {
    throw new Error(error);
  }
});
exports.updateCoupon = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedCoupon);
  } catch (error) {
    throw new Error(error);
  }
});
exports.deleteCoupon = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const deletedCoupon = await Coupon.findByIdAndDelete(id);
    res.json(deletedCoupon);
  } catch (error) {
    throw new Error(error);
  }
});
exports.getCoupon = catchAsyncErrors(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const getaCoupon = await Coupon.findById(id);
    res.json(getaCoupon);
  } catch (error) {
    throw new Error(error);
  }
});
exports.getallCoupon = catchAsyncErrors(async (req, res) => {
  try {
    const getallCoupon = await Coupon.find();
    res.json(getallCoupon);
  } catch (error) {
    throw new Error(error);
  }
});
