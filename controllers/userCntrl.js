const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");
const Coupon = require("../models/couponModel");
const Order = require("../models/orderModel");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");
const uniqid = require("uniqid");
const validateMongoDbId = require("../utils/validateMongodbId");
const { generateToken } = require("../config/jwtToken");
// const cloudinary = require("cloudinary");

// Register a User

exports.registerUser = asyncHandler(async (req, res, next) => {
  /**
  * TODO:Get the email from req.body
  */
  const email = req.body.email;
  /**
   * TODO:With the help of email find the user exists or not
   */
  const findUser = await User.findOne({ email: email });

  if (!findUser) {
    /**
     * TODO:if user not found user create a new user
     */
    const newUser = await User.create(req.body);
    res.json({
      success: true,
      message: "Successfully Registered User",
      newUser
    });
  } else {
    /**
     * TODO:if user found then thow an error: User already exists
     */
    throw new Error("User Already Exists");
  }
});

// Login User
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findUser = await User.findOne({ email });
  if (findUser && (await findUser.comparePassword(password))) {
    const token = await generateToken(findUser?._id);
    const updateuser = await User.findByIdAndUpdate(
      findUser.id,
      {
        token: token,
      },
      { new: true }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      message: "Logged In",
      _id: findUser?._id,
      firstname: findUser?.firstname,
      lastname: findUser?.lastname,
      email: findUser?.email,
      mobile: findUser?.mobile,
      role:findUser?.role,
      token: generateToken(findUser?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// Login Admin
exports.loginAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // check if user exists or not
  const findAdmin = await User.findOne({ email });
  if (findAdmin.role !== "admin") throw new Error("Not Authorised");
  if (findAdmin && (await findAdmin.comparePassword(password))) {
    const token = await generateToken(findAdmin?._id);
    const updateuser = await User.findByIdAndUpdate(
      findAdmin.id,
      {
        token: token,
      },
      { new: true }
    );
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000,
    });
    res.json({
      _id: findAdmin?._id,
      firstname: findAdmin?.firstname,
      lastname: findAdmin?.lastname,
      email: findAdmin?.email,
      mobile: findAdmin?.mobile,
      role:findAdmin?.role,
      token: generateToken(findAdmin?._id),
    });
  } else {
    throw new Error("Invalid Credentials");
  }
});

// handle refresh token

exports.handleRefreshToken = asyncHandler(async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.token) throw new Error("No Refresh Token in Cookies");
  const token = cookie.token;
  const user = await User.findOne({ token });
  if (!user) throw new Error(" No Refresh token present in db or not matched");
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err || user.id !== decoded.id) {
      throw new Error("There is something wrong with refresh token");
    }
    const accessToken = generateToken(user?._id);
    res.json({ accessToken });
  });
});


// Logout User
exports.logout = asyncHandler(async (req, res, next) => {
  const cookie = req.cookies;
  if (!cookie?.token) throw new Error("No Refresh Token in Cookies");
  const token = cookie.token;
  const user = await User.findOne({ token });
  if (!user) {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
    });
    return res.sendStatus(204); // forbidden
  }
  await User.findOneAndUpdate(token, {
    token: "",
  });
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
  });
  res.sendStatus(204); // forbidden
});

// Forgot Password
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found with this email");

  // const token = await user.getResetPasswordToken();
  // await user.save();
  // const resetURL = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='http://localhost:3000/reset-password/${token}'>Click Here</>`;
  // const data = {
  //   to: email,
  //   text: "Hey User",
  //   subject: "Forgot Password Link",
  //   html: resetURL,
  // };
  // sendEmail(data);
  // res.json(token);

  const resetToken = await user.createPasswordResetToken();
  await user.save();

  // const resetPasswordUrl = `${req.protocol}://${req.get(
  //   "host"
  // )}/api/v1/password/reset/${resetToken}`;

  const message = `Hi, Please follow this link to reset Your Password. This link is valid till 10 minutes from now. <a href='https://fontend-ecom.netlify.app/reset-password/${resetToken}'>Click Here</>`;

  try {
    await sendEmail({
      email: user.email,
      subject: `AleeZa Mart Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
      resetToken,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Reset Password
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  console.log(hashedToken);
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) throw new Error(" Token Expired, Please try again later");
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({
    success: true,
    message: "Successfully Password Reset",
  });
});

// Get User Detail
exports.getUserDetails = asyncHandler(async (req, res, next) => {

  const { _id } = req.user;
  const user = await User.findById(_id);

  res.status(200).json({
    user,
  });
});

// update User password
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { password } = req.body;
  validateMongoDbId(_id);
  const user = await User.findById(_id);
  if (password) {
    user.password = password;
    const updatedPassword = await user.save();
    res.json({
      success: true,
      message: "Successfully Updated User Password",
    });
  } else {
    res.json(user);
  }
});

// update User Profile
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const user = await User.findByIdAndUpdate(
      _id,
      {
        firstname: req?.body?.firstname,
        lastname: req?.body?.lastname,
        email: req?.body?.email,
        mobile: req?.body?.mobile,
      },
      {
        new: true,
      }
    );
    res.json({
      success: true,
      message: "Successfully Updated User",
      user
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Get all users(admin)
exports.getAllUser = asyncHandler(async (req, res, next) => {
  try {
    const getUsers = await User.find().populate("wishlist");
    res.json({
      success: true,
      message: "All Users",
      getUsers
    });
  } catch (error) {
    throw new Error(error);
  }
});

// Get single user (admin)
exports.getSingleUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const getaUser = await User.findById(id);
    res.json({
      getaUser,
    });
  } catch (error) {
    throw new Error(error);
  }
});

// update User Role -- Admin
exports.updateUserRole = asyncHandler(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});

// Delete User --Admin
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    await User.findByIdAndDelete(id);
    res.json({
      success: true,
      message: "Successfully Deleted User",
    });
  } catch (error) {
    throw new Error(error);
  }
});


// Block User --Admin
exports.blockUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const blockUser = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: true,
      },
      {
        new: true,
      }
    );
    res.json({
      success: true,
      message: "Successfully Blocked User",
    });
  } catch (error) {
    throw new Error(error);
  }
})

exports.unBlockUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  validateMongoDbId(id);

  try {
    const unblock = await User.findByIdAndUpdate(
      id,
      {
        isBlocked: false,
      },
      {
        new: true,
      }
    );
    res.json({
      success: true,
      message: "Successfully Unblocked User",
    });
  } catch (error) {
    throw new Error(error);
  }
});

exports.getWishlist = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  console.log(_id)
  try {
    const findUser = await User.findById(_id).populate("wishlist");
    res.json(findUser);
  } catch (error) {
    throw new Error(error)

  }
});

exports.saveAddress = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id);

  try {
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        address: req?.body?.address,
      },
      {
        new: true,
      }
    );
    res.json(updatedUser);
  } catch (error) {
    throw new Error(error);
  }
});

exports.userCart = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { productId, color, quantity, price } = req.body;
  validateMongoDbId(_id);
  try {


    let newCart = await new Cart({
      userId: _id,
      productId,
      quantity,
      price,
      color
    }).save();
    res.json(newCart);

  } catch (error) {
    throw new Error(error);

  }
});

exports.getCart = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id)
  try {
    const cart = await Cart
      .find({ userId: _id })
      .populate("productId")
      .populate("color");
    // console.log(cart)
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }
});
exports.updateQuantityCart = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { id, newQuantity } = req.params;
  validateMongoDbId(_id)
  try {
    const cart = await Cart.findOne({ userId: _id, _id: id })
    cart.quantity = newQuantity;
    cart.save();
    res.json(cart);
  } catch (error) {
    throw new Error(error);
  }

})
exports.removeProductFromCart = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const { id } = req.params;
  validateMongoDbId(_id)
  try {
    const removeProduct = await Cart
      .deleteOne({ userId: _id, _id: id })

    res.json(removeProduct);
  } catch (error) {
    throw new Error(error);
  }
});

exports.emptyCart = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id)
  try {
    const emptyCart = await Cart
      .deleteMany({ userId: _id })

    res.json(emptyCart);
  } catch (error) {
    throw new Error(error);
  }
});

exports.createOrder = asyncHandler(async (req, res, next) => {
  const { shippingInfo, paymentInfo, orderItems, totalPrice, totalPriceAfterDiscount } = req.body;
  const { _id } = req.user;
  try {
    const order = await Order.create({
      shippingInfo, paymentInfo, orderItems, totalPrice, totalPriceAfterDiscount, user: _id
    });
    res.json({
      order,
      success: true,
    })

  } catch (error) {
    throw new Error(error);
  }
});

exports.getOrder = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  validateMongoDbId(_id)
  try {
    const getOrder = await Order
      .find({ user: _id })
      .populate('user')
      .populate("orderItems.product")
      .populate('orderItems.color').exec();
    res.json(getOrder);
  } catch (error) {
    throw new Error(error);
  }
});

exports.getOrderMonthWise = asyncHandler(async (req, res) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1)
    endDate = months[d.getMonth()] + " " + d.getFullYear()

  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: {
          month: "$month"
        },
        count: {
          $sum: 1
        },
        amount: {
          $sum: "$totalPriceAfterDiscount"
        }
      }
    }
  ])
  res.json(data)
});


exports.getYearlyOrder = asyncHandler(async (req, res) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let d = new Date();
  let endDate = "";
  d.setDate(1);
  for (let index = 0; index < 11; index++) {
    d.setMonth(d.getMonth() - 1)
    endDate = months[d.getMonth()] + " " + d.getFullYear()

  }
  const data = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $lte: new Date(),
          $gte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: null,
        count: {
          $sum: 1
        },
        amount: {
          $sum: "$totalPriceAfterDiscount"
        }
      }
    }
  ])
  res.json(data)
});


// exports.applyCoupon = asyncHandler(async (req, res, next) => {
//   const { coupon } = req.body;
//   const { _id } = req.user;
//   validateMongoDbId(_id);
//   const validCoupon = await Coupon.findOne({ name: coupon });
//   if (validCoupon === null) {
//     throw new Error("Invalid Coupon");
//   }
//   const user = await User.findOne({ _id });
//   let { cartTotal } = await Cart.findOne({
//     orderby: user._id,
//   }).populate("products.product");
//   let totalAfterDiscount = (
//     cartTotal -
//     (cartTotal * validCoupon.discount) / 100
//   ).toFixed(2);
//   await Cart.findOneAndUpdate(
//     { orderby: user._id },
//     { totalAfterDiscount },
//     { new: true }
//   );
//   res.json(totalAfterDiscount);
// });

// exports.cashOrder = asyncHandler(async (req, res, next) => {
//   const { COD, couponApplied } = req.body;
//   const { _id } = req.user;
//   validateMongoDbId(_id);

//   try {
//     if (!COD) throw new Error("Create Cash Order Failed");
//     let userCart = await Cart.findOne({ orderby: _id });
//     let finalAmount = 0;
//     if (couponApplied && userCart.totalAfterDiscount) {
//       finalAmount = userCart.totalAfterDiscount;
//     } else {
//       finalAmount = userCart.cartTotal;
//     }

//     let newOrder = await new Order(
//       {
//         products: userCart.products,
//         paymentIntent: {
//           id: uniqid(),
//           method: COD,
//           amount: finalAmount,
//           status: "Cash on Delivery",
//           created: Date.now(),
//           currency: "usd",
//         },
//         orderby: _id,
//         orderStatus: "Cash on Delivery",
//       }).save();
//     let update = userCart.products.map((item) => {
//       return {
//         updateOne: {
//           filter: { _id: item.product._id },
//           update: { $inc: { quantity: -item.count, sold: +item.count } },
//         },
//       };
//     });
//     const updated = await Product.bulkWrite(update, {});
//     res.json({ message: "Success" })
//   } catch (error) {
//     throw new Error(error);

//   }
// });
exports.getAllOrder = asyncHandler(async (req, res, next) => {
  // const { _id } = req.user;
  // validateMongoDbId(_id)
  try {
    // const getOrder = await Order
    //   .findOne({ orderby: _id })
    //   .populate("products.product").exec();
    const getOrder = await Order.find()
      .populate("orderItems.product")
      .populate('orderItems.color')
      .populate('user').exec();
    res.json(getOrder);
  } catch (error) {
    throw new Error(error);
  }
});

exports.getOrderByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const userorders = await Order.findById(id)
      .populate("orderItems.product")
      .populate('orderItems.color')
      .populate('user').exec();
    res.json(userorders);
  } catch (error) {
    throw new Error(error);
  }
});

exports.orderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const { id } = req.params;
  validateMongoDbId(id);
  try {
    const orderStatus = await Order.findByIdAndUpdate(id, {
      orderStatus: status,
      // paymentIntent: {
      //   status: status,
      // }
    }, {
      new: true,
    });
    res.json(orderStatus);
  } catch (error) {
    throw new Error(error)
  }
})