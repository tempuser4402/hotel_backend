const express = require("express");
const router = express.Router();

const {
  getFloors,
  getFloorById,
  createFloor,
  updateFloor,
  deleteFloor,
} = require("../../controllers/rooms/floorCtrl");

router.get("/", getFloors);
router.post("/", createFloor);

router.get("/:id", getFloorById);
router.put("/:id", updateFloor);
router.delete("/:id", deleteFloor);

module.exports = router;