const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const ProductController = require("../controllers/product_controller");
const path = require('path');
const AdminVerification = require("../helpers/verify_admin");
const sequelize = require("../helpers/database")
require("dotenv").config();
const multer = require("multer");


const mode = process.env.NODE_ENV || "development";



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: async function (req, file, cb) {
        const productName = req.params.productName;
        if (!productName) {
            return cb(new Error("Product Name is required"));
        }
        const productQuery = `SELECT * FROM "Product" WHERE "productName" = :productName`;

        // check it whether it is working or not
        const product = await sequelize.query(
            productQuery,
            {
                replacements: { productName },
                type: sequelize.QueryTypes.SELECT
            }
        );
        if (!product) {
            return cb(new Error("Product with this productName is not available"));
        }

        const extension = path.extname(file.originalname);

        // Extract file extension
        cb(null, req.params.productName + extension);
    }
});

// Initialize Multer with Storage
// const upload = multer({ storage: storage });


const upload = multer({ storage: mode === "development" ? storage : multer.memoryStorage() });





router.post("/createProduct", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.createProductForRemote);

//router.post("/createProduct2",  ProductController.createProductForRemote);

router.get("/listAllProductsUnderACategory/:categoryId", JWT.verifyAccessToken, ProductController.getProductUnderACategoryForRemote);

router.get("/listAllProducts", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.listAllProductsRemote);

router.get("/getAProduct/:productId", JWT.verifyAccessToken, ProductController.getProductById);

router.get("/searchProducts", JWT.verifyAccessToken, ProductController.searchProduct);

//router.get("/listAllAvailableProducts", JWT.verifyAccessToken, ProductController.listAllAvailableProducts);

router.get("/getProductInventory", JWT.verifyAccessToken, ProductController.getProductInventory);

router.put("/updateAProduct/:productId", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.updateProductRemote);

router.delete("/deleteAProduct/:productId", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.deleteProductRemote);

router.patch("/updateProductImage/:productId/:productName", JWT.verifyAccessToken, AdminVerification.verifyAdmin, upload.single('image'), mode === "development" ? ProductController.uploadImageToLocalFile : ProductController.updateProductImage);

router.patch("/updateProductStock/:productId", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.updateProductStockQuantity);

router.patch("/updateProductPrice/:productId", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.updateProductPrice);

router.patch("/updateProductAvailability/:productId", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.updateProductAvailability);

router.patch("/updateisTrending/:productId", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.updateProductIsTrendingRemote);

router.delete("/deleteProductImage/:productId", JWT.verifyAccessToken, AdminVerification.verifyAdmin, ProductController.deleteProductImage);


module.exports = router;
