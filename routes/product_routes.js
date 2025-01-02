const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const ProductController = require("../controllers/product_controller");
const path = require('path');
require("dotenv").config();
const multer = require("multer");


const mode = process.env.NODE_ENV || "development";



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: function (req, file, cb) {
        const productName = req.params.productName;
        if(!productName){
            return cb(new Error("Product Name is required"));
        }
        const extension = path.extname(file.originalname);

        // Extract file extension
        cb(null, req.params.productName + extension);
    }
});

// Initialize Multer with Storage
// const upload = multer({ storage: storage });


const upload = multer({ storage: mode === "development" ? storage : multer.memoryStorage() });





router.post("/createProduct", JWT.verifyAccessToken, ProductController.createProduct);

router.get("/listAllProducts", JWT.verifyAccessToken, ProductController.listAllProducts);

router.get("/getAProduct/:productId", JWT.verifyAccessToken, ProductController.getProductById);

router.put("/updateAProduct/:productId", JWT.verifyAccessToken, ProductController.updateProduct);

router.delete("/deleteAProduct/:productId", JWT.verifyAccessToken, ProductController.deleteProduct);

router.patch("/updateProductImage/:productId/:productName", JWT.verifyAccessToken, upload.single('image'), mode === "development" ? ProductController.uploadImageToLocalFile :  ProductController.updateProductImage);

router.delete("/deleteProductImage/:productId", JWT.verifyAccessToken, ProductController.deleteProductImage);

router.post("/sampleProductImageUpload/:productId/:productName", upload.single('image'), ProductController.uploadImageToLocalFile);

module.exports = router;
