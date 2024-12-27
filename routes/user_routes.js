const router = require("express").Router();
const AuthController = require("../controllers/auth_controller")
const JWT = require("../helpers/jwt_helper");
const OwnerTokenVerification = require("../helpers/owner_token_verification");


router.post("/signUp", OwnerTokenVerification.verifyOwnerToken, AuthController.signUp);

router.post("/signIn", OwnerTokenVerification.verifyOwnerToken, AuthController.signIn);


router.get("/listAllUsers", JWT.verifyAccessToken, AuthController.listAllUsers);

router.put("/updateAUser/:id", JWT.verifyAccessToken, AuthController.updateUser);

router.delete("/deleteAUser/:id", JWT.verifyAccessToken, AuthController.deleteUser);


module.exports = router;