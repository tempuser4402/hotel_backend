const express = require("express");
const router = express.Router();

const {
  getRoomAvailability,
  createRoomBlock,
  getRoomBlocks,
  releaseRoomBlock,
} = require("../../controllers/rooms/roomAvailabilityCtrl");

router.get("/", getRoomAvailability);

router.get("/blocks", getRoomBlocks);
router.post("/blocks", createRoomBlock);
router.patch("/blocks/:id/release", releaseRoomBlock);

module.exports = router;