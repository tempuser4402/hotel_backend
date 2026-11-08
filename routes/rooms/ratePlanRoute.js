const express = require("express");
const router = express.Router();

const {
  getRatePlans,
  getRatePlanById,
  createRatePlan,
  updateRatePlan,
  duplicateRatePlan,
  toggleRatePlanStatus,
  deleteRatePlan,
  calculateRate,
} = require("../../controllers/rooms/ratePlanCtrl");

router.post("/calculate", calculateRate);

router.get("/", getRatePlans);
router.post("/", createRatePlan);

router.post("/:id/duplicate", duplicateRatePlan);
router.patch("/:id/toggle-status", toggleRatePlanStatus);

router.get("/:id", getRatePlanById);
router.put("/:id", updateRatePlan);
router.delete("/:id", deleteRatePlan);

module.exports = router;