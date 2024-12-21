const router = require("express").Router();
const AuthController = require("../controllers/auth_controller")
const JWT = require("../helpers/jwt_helper");


router.post("/signUp", AuthController.signUp);

router.post("/signIn", AuthController.signIn);


router.get("/listAllUsers", JWT.verifyAccessToken, AuthController.listAllUsers);

router.put("/updateAUser/:id", JWT.verifyAccessToken, AuthController.updateUser);

router.delete("/deleteAUser/:id", JWT.verifyAccessToken, AuthController.deleteUser);









module.exports = router;