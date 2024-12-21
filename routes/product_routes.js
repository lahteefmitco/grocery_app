const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const ProductController = require("../controllers/product_controller");

const multer = require("multer");


const upload = multer({ storage: multer.memoryStorage() });





router.post("/createProduct", JWT.verifyAccessToken, ProductController.createProduct);

router.get("/listAllProducts", JWT.verifyAccessToken, ProductController.listAllProducts);

router.get("/getAProduct/:productId", JWT.verifyAccessToken, ProductController.getProductById);

router.put("/updateAProduct/:productId", JWT.verifyAccessToken, ProductController.updateProduct);

router.delete("/deleteAProduct/:productId", JWT.verifyAccessToken, ProductController.deleteProduct);

router.patch("/updateProductImage/:productId", JWT.verifyAccessToken, upload.single('image'),  ProductController.updateProductImage);





module.exports = router;
