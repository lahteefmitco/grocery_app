const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const DashboardController = require("../controllers/dash_board_controller");
const AdminVerification = require("../helpers/verify_admin");
require("dotenv").config();
const multer = require("multer");

const mode = process.env.NODE_ENV || "development";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: function (req, file, cb) {
        const productName = req.params.productName;
        if (!productName) {
            return cb(new Error("Product Name is required"));
        }
        const extension = path.extname(file.originalname);

        // Extract file extension
        cb(null, req.params.productName + extension);
    }
});




const upload = multer({ storage: mode === "development" ? storage : multer.memoryStorage() });


router.get("/adminDashBoardDatas", JWT.verifyAccessToken, AdminVerification.verifyAdmin, mode == "development" ? DashboardController.adminDashBoardForSqlite :DashboardController.adminDashBoardForPostgres );
router.get("/userDashBoardDatas", JWT.verifyAccessToken, mode == "development" ? DashboardController.userDashBoardsqlite :DashboardController.userDashBoardPostgres );

router.post("/creatBanners", upload.array("banners",10), DashboardController.createBannersRemote);

router.delete("/deleteABanner/:bannerId",  DashboardController.removeABannerRemote);

module.exports = router;


