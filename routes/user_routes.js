const router = require("express").Router();
const AuthController = require("../controllers/auth_controller")
const JWT = require("../helpers/jwt_helper");
const AdminVerification = require("../helpers/verify_admin");



router.post("/signUp", JWT.verifyAuthToken, AuthController.signUp);

router.post("/signIn",JWT.verifyAuthToken, AuthController.signIn);


router.get("/listAllUsers", JWT.verifyAccessToken, AdminVerification.verifyAdmin, AuthController.listAllUsers);

router.put("/updateAUser/:id", JWT.verifyAccessToken, AdminVerification.verifyAdmin, AuthController.updateUser);

router.delete("/deleteAUser/:id", JWT.verifyAccessToken, AdminVerification.verifyAdmin, AuthController.deleteUser);


module.exports = router;