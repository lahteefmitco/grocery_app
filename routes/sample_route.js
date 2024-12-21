const router = require("express").Router();
const JWT = require("../helpers/jwt_helper");
const SampleController = require("../controllers/sample_controller");


router.post("/addSample", SampleController.addSample);
router.get("/listAllSamples", SampleController.getAllSamples);
router.get("/getASample",SampleController.getSamplesAboveDateTime);



module.exports = router;