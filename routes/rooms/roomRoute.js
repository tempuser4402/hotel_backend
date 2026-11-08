const express = require("express");
const router = express.Router();

const {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  updateRoomStatus,
  updateHousekeepingStatus,
  updateMaintenanceStatus,
  toggleRoomStatus,
  deleteRoom,
  updateRoomPositions,
  resetRoomPositions,
  getRoomOverview,
} = require("../../controllers/rooms/roomCtrl");

// Specific routes must come before /:id.
router.patch("/positions", updateRoomPositions);
router.patch("/floor/:floorId/reset-positions", resetRoomPositions);

router.get("/", getRooms);
router.post("/", createRoom);

router.get("/overview", getRoomOverview);
router.get("/:id", getRoomById);
router.put("/:id", updateRoom);
router.patch("/:id/status", updateRoomStatus);
router.patch("/:id/housekeeping", updateHousekeepingStatus);
router.patch("/:id/maintenance", updateMaintenanceStatus);
router.patch("/:id/toggle-status", toggleRoomStatus);
router.delete("/:id", deleteRoom);

module.exports = router;
