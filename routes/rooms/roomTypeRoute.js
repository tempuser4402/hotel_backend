const express = require("express");
const router = express.Router();

const {
  getRoomTypes,
  getRoomTypeById,
  createRoomType,
  updateRoomType,
  toggleRoomTypeStatus,
  deleteRoomType,
} = require("../../controllers/rooms/roomTypeCtrl");

router.get("/", getRoomTypes);
router.post("/", createRoomType);

router.get("/:id", getRoomTypeById);
router.put("/:id", updateRoomType);
router.patch("/:id/toggle-status", toggleRoomTypeStatus);
router.delete("/:id", deleteRoomType);

module.exports = router;