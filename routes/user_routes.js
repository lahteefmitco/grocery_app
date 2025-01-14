const router = require("express").Router();
const AuthController = require("../controllers/auth_controller")
const JWT = require("../helpers/jwt_helper");
const path = require('path');
const AdminVerification = require("../helpers/verify_admin");
const sequelize = require("../helpers/database");

const multer = require("multer");


const mode = process.env.NODE_ENV || "development";



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: async function (req, file, cb) {
        const id = req.params.id;
        console.log(id);
        

        // get userName
        const userNameSqlQuery = `SELECT "userName" FROM "User" WHERE id = :id`;

        const [ userNameResult] = await sequelize.query(userNameSqlQuery,{
            replacements:{id},
            type:sequelize.QueryTypes.SELECT
        })

        const userName = userNameResult.userName;

        console.log(`userName ${userNameResult.userName}`);
        

        if(!userName ){
            return cb(new Error("User Name is required"));
        }
        req.userName =userName;
        const extension = path.extname(file.originalname);

        // Extract file extension
        cb(null, userName + extension);
    }
});

// Initialize Multer with Storage
// const upload = multer({ storage: storage });


const upload = multer({ storage: mode === "development" ? storage : multer.memoryStorage() });



router.post("/signUp", JWT.verifyAuthToken, AuthController.signUp);

router.post("/signIn",JWT.verifyAuthToken, AuthController.signIn);


router.get("/listAllUsers", JWT.verifyAccessToken, AdminVerification.verifyAdmin, AuthController.listAllUsers);

router.put("/updateAUser/:id", JWT.verifyAccessToken, AdminVerification.verifyAdmin, AuthController.updateUser);

router.delete("/deleteAUser/:id", JWT.verifyAccessToken, AdminVerification.verifyAdmin, AuthController.deleteUser);


router.patch("/profileImage/:id",JWT.verifyAccessToken, upload.single("image"),mode == "development"? AuthController.addImageToLocal : AuthController.addImageToRemote);


module.exports = router;