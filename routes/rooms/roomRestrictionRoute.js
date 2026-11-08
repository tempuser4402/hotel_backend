const express = require("express");
const router = express.Router();

const {
  getRestrictions,
  getRestrictionById,
  createRestriction,
  updateRestriction,
  toggleRestrictionStatus,
  deleteRestriction,
} = require("../../controllers/rooms/roomRestrictionCtrl");

router.get("/", getRestrictions);
router.post("/", createRestriction);

router.patch("/:id/toggle-status", toggleRestrictionStatus);
router.get("/:id", getRestrictionById);
router.put("/:id", updateRestriction);
router.delete("/:id", deleteRestriction);

module.exports = router;