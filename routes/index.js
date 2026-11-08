const express = require("express");
const router = express.Router();

router.use("/floors", require("./rooms/floorRoute"));
router.use("/amenities", require("./rooms/amenityRoute"));
router.use("/types", require("./rooms/roomTypeRoute"));
router.use("/rooms", require("./rooms/roomRoute"));
router.use("/rate-plans", require("./rooms/ratePlanRoute"));
router.use("/restrictions", require("./rooms/roomRestrictionRoute"));
router.use("/availability", require("./rooms/roomAvailabilityRoute"));

router.get(
  "/overview",
  require("../controllers/rooms/roomOverviewCtrl").getRoomOverview,
);

module.exports = router;
