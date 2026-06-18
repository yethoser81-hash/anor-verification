const express = require("express");
const router = express.Router();

const { forgeSeal } =
require("../controllers/forgeController");

const upload =
require("../middlewares/forgeUpload");

router.post(
    "/",
    upload.fields([
        {
            name: "certificate",
            maxCount: 1
        },
        {
            name: "packaging_image",
            maxCount: 1
        }
    ]),
    forgeSeal
);

module.exports = router;