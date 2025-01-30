const router = require("express").Router(); 

const BackupController = require("../controllers/backup_controller");

router.get("/backup",BackupController.backUp)

module.exports = router;