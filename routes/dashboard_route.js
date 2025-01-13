const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const DashboardController = require("../controllers/dash_board_controller");
const AdminVerification = require("../helpers/verify_admin");
require("dotenv").config();

const mode = process.env.NODE_ENV || "development";


router.get("/adminDashBoardDatas", mode == "development" ? DashboardController.adminDashBoardForSqlite :DashboardController.adminDashBoardForPostgres );

module.exports = router;


