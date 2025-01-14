const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const CartController = require("../controllers/cart_controller");
const AdminVerification = require("../helpers/verify_admin");


router.get("/sampleQuery",CartController.sampleQuery);
router.post("/placeAnOrder", JWT.verifyAccessToken, CartController.addToCart);

router.get("/listAllOrders", JWT.verifyAccessToken, AdminVerification.verifyAdmin, CartController.listAllCarts);
router.get("/getAnOrder/:cartId", JWT.verifyAccessToken, CartController.getCartById);
router.get("/listAllOrdersByUser/:userId", JWT.verifyAccessToken, CartController.getCartsByUserId);
router.get("/searchOrdersInBetweenDates", JWT.verifyAccessToken, CartController.searchCartsBetweenDates);

router.put("/updateAnOrder/:cartId", JWT.verifyAccessToken, CartController.updateCartWithProducts);
router.delete("/deleteAnOrder/:cartId", JWT.verifyAccessToken, CartController.deleteCartWithProducts);



module.exports = router;