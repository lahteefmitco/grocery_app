const router = require("express").Router();
const AuthController = require("../controllers/auth_controller")
const JWT = require("../helpers/jwt_helper");
const path = require('path');
const AdminVerification = require("../helpers/verify_admin");
const sequelize = require("../helpers/database");
const Transporter = require("../helpers/email_sender")

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

        const [userNameResult] = await sequelize.query(userNameSqlQuery, {
            replacements: { id },
            type: sequelize.QueryTypes.SELECT
        })

        const userName = userNameResult.userName;

        console.log(`userName ${userNameResult.userName}`);


        if (!userName) {
            return cb(new Error("User Name is required"));
        }
        req.userName = userName;
        const extension = path.extname(file.originalname);

        // Extract file extension
        cb(null, userName + extension);
    }
});

// Initialize Multer with Storage
// const upload = multer({ storage: storage });


const upload = multer({ storage: mode === "development" ? storage : multer.memoryStorage() });

router.get("/forgotPassword/:userName", (req, res, next) => {
    try {
        // Construct the URL with the secret token as a query parameter
        const resetLink = `https://sample.com/reset-password?token=${encodeURIComponent(secretToken)}`;

        // Email options
        const mailOptions = {
            from: 'your-email@gmail.com', // Sender address
            to: 'recipient-email@example.com', // Recipient email
            subject: 'Password Reset', // Subject line
            html: `
    <p>Please click the link below to reset your password:</p>
    <a href="${resetLink}" target="_blank">${resetLink}</a>
  `, // HTML body
        };

        // Send the email
        Transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error:', error);
            } else {
                console.log('Email sent:', info.response);
                console.log('Secret Token:', secretToken); // Log the token for further use
            }
        });


    } catch (error) {
        next(error);
    }
});

router.get("/resetPassword/:userName", (req, res, next) => {
    res.send("Hi");
});

router.post("/signUp", JWT.verifyAuthToken, AuthController.signUp);

router.post("/signIn", JWT.verifyAuthToken, AuthController.signIn);


router.get("/listAllUsers", JWT.verifyAccessToken, AdminVerification.verifyAdmin, AuthController.listAllUsers);

router.put("/updateAUser/:id", JWT.verifyAccessToken, AuthController.updateUser);

router.delete("/deleteAUser/:id", JWT.verifyAccessToken, AdminVerification.verifyAdmin, AuthController.deleteUser);


router.patch("/profileImage/:id", JWT.verifyAccessToken, upload.single("image"), mode == "development" ? AuthController.addImageToLocal : AuthController.addImageToRemote);


module.exports = router;