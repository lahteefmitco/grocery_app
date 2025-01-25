const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const CategoryController = require("../controllers/category_controller");
const AdminVerification = require("../helpers/verify_admin");



router.post("/createCategory", JWT.verifyAccessToken, AdminVerification.verifyAdmin, CategoryController.createCategory);

router.get("/listAllCategories", JWT.verifyAccessToken, CategoryController.getAllCategories);

router.get("/getACategory/:id", JWT.verifyAccessToken, CategoryController.getACategoryById);

router.put("/updateACategory/:id", JWT.verifyAccessToken, AdminVerification.verifyAdmin, CategoryController.updateACategory);

router.delete("/deleteACategory/:id", JWT.verifyAccessToken, AdminVerification.verifyAdmin, CategoryController.deleteACategory);

module.exports = router;

