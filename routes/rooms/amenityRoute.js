const express = require("express");
const router = express.Router();

const {
  getAmenities,
  createAmenity,
  updateAmenity,
  toggleAmenityStatus,
  deleteAmenity,
} = require("../../controllers/rooms/amenityCtrl");

router.get("/", getAmenities);
router.post("/", createAmenity);

router.put("/:id", updateAmenity);
router.patch("/:id/toggle-status", toggleAmenityStatus);
router.delete("/:id", deleteAmenity);

module.exports = router;