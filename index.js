const express =require('express');
const dbConnect = require('./config/dbConnect');

const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT||4000;
const bodyParser = require('body-parser');
const errorMiddleware = require("./middlewares/error");
const cookieParser = require("cookie-parser");
const morgan = require("morgan")
const cors = require("cors");
dbConnect();
app.use(morgan("dev"))
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cookieParser());

app.use('/',(req,res)=>{
    res.send("Hello guys, its backend");
})
const authRouter = require('./routes/AuthRoute');
const productRouter = require('./routes/ProductRoute');
const blogRouter = require('./routes/BlogRoute');
const productCategoryRoouter = require('./routes/ProductCategoryRoute');
const blogCatRouter = require('./routes/BlogCatRoute');
const brandRouter = require('./routes/BrandRoute');
const couponRouter = require('./routes/CouponRoute');
const colorRouter = require('./routes/ColorRoute');
const uploadRouter = require('./routes/UploadRoute');
const enqRouter = require('./routes/EnqRoute');

app.use('/api/v1/user',authRouter);
app.use('/api/v1/product',productRouter);
app.use('/api/v1/blog',blogRouter);
app.use('/api/v1/category',productCategoryRoouter);
app.use('/api/v1/blogcategory',blogCatRouter);
app.use('/api/v1/brand',brandRouter);
app.use('/api/v1/coupon',couponRouter);
app.use('/api/v1/color',colorRouter);
app.use('/api/v1/upload',uploadRouter);
app.use('/api/v1/enquiry',enqRouter);

app.use(errorMiddleware);
app.listen(PORT,()=>{
    console.log(`Server is working on PORT ${PORT}`);
});