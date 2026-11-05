const express = require("express");

const { createTest, getParagraphs } = require("../controllers/testCtrl");
const router = express.Router();

router.post("/create", createTest);
router.get("/get", getParagraphs);

module.exports = router;
