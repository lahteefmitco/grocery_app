const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const CartController = require("../controllers/cart_controller");
const AdminVerification = require("../helpers/verify_admin");


router.get("/sampleQuery",CartController.sampleQuery);
router.post("/addToCart", JWT.verifyAccessToken, CartController.addToCart);
router.post("/addToCart2", JWT.verifyAccessToken, CartController.addToCart2);
router.get("/listAllCarts", JWT.verifyAccessToken, AdminVerification.verifyAdmin, CartController.listAllCarts);
router.get("/getACart/:cartId", JWT.verifyAccessToken, CartController.getCartById);
router.get("/listAllCartsByUser/:userId", JWT.verifyAccessToken, CartController.getCartsByUserId);
router.get("/searchCartsInBetweenDates", JWT.verifyAccessToken, CartController.searchCartsBetweenDates);

router.put("/updateACart/:cartId", JWT.verifyAccessToken, CartController.updateCartWithProducts);
router.delete("/deleteACart/:cartId", JWT.verifyAccessToken, CartController.deleteCartWithProducts);



module.exports = router;