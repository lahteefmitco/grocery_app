const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const CartController = require("../controllers/cart_controller");



router.post("/addToCart", JWT.verifyAccessToken, CartController.addToCart);
router.get("/listAllCarts", JWT.verifyAccessToken, CartController.listAllCarts);
router.get("/getACart/:cartId", JWT.verifyAccessToken, CartController.getCartById);
router.get("/listAllCartsByUser/:userId", JWT.verifyAccessToken, CartController.getCartsByUserId);
router.get("/searchCartsInBetweenDates", JWT.verifyAccessToken, CartController.searchCartsBetweenDates);

router.put("/updateACart/:cartId", JWT.verifyAccessToken, CartController.updateCartWithProducts);
router.delete("/deleteACart/:cartId", JWT.verifyAccessToken, CartController.deleteCartWithProducts);







module.exports = router;