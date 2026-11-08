const RoomRestriction = require("../../models/rooms/RoomRestriction");

const populateRoomTypes = (query) => query.populate("roomTypes", "name code");

const sendRestriction = (restriction) => ({
  ...restriction.toObject(),
  id: String(restriction._id),
});

// GET ALL RESTRICTIONS
exports.getRestrictions = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { code: { $regex: req.query.search, $options: "i" } },
        { reason: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const restrictions = await populateRoomTypes(
      RoomRestriction.find(filter).sort({ startDate: 1 }),
    );

    res.status(200).json({
      success: true,
      count: restrictions.length,
      data: restrictions.map(sendRestriction),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET RESTRICTION BY ID
exports.getRestrictionById = async (req, res) => {
  try {
    const restriction = await populateRoomTypes(
      RoomRestriction.findById(req.params.id),
    );

    if (!restriction) {
      return res.status(404).json({
        success: false,
        message: "Restriction not found",
      });
    }

    res.status(200).json({
      success: true,
      data: sendRestriction(restriction),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE RESTRICTION
exports.createRestriction = async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      roomTypes,
      startDate,
      endDate,
      days,
      minStay,
      maxStay,
      advanceDays,
      reason,
      status,
    } = req.body;

    if (!code?.trim() || !name?.trim() || !type || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Code, name, type and date range are required",
      });
    }

    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    const restriction = await RoomRestriction.create({
      code,
      name,
      type,
      roomTypes: roomTypes || [],
      startDate,
      endDate,
      days: days || [],
      minStay: minStay ?? null,
      maxStay: maxStay ?? null,
      advanceDays: advanceDays ?? null,
      reason: reason || "",
      status: status || "Active",
    });

    const populated = await populateRoomTypes(
      RoomRestriction.findById(restriction._id),
    );

    res.status(201).json({
      success: true,
      message: "Restriction created successfully",
      data: sendRestriction(populated),
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message:
        error.code === 11000
          ? "Restriction code already exists"
          : error.message,
    });
  }
};

// UPDATE RESTRICTION
exports.updateRestriction = async (req, res) => {
  try {
    const restriction = await RoomRestriction.findById(req.params.id);

    if (!restriction) {
      return res.status(404).json({
        success: false,
        message: "Restriction not found",
      });
    }

    const fields = [
      "code",
      "name",
      "type",
      "roomTypes",
      "startDate",
      "endDate",
      "days",
      "minStay",
      "maxStay",
      "advanceDays",
      "reason",
      "status",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        restriction[field] = req.body[field];
      }
    });

    if (new Date(restriction.endDate) < new Date(restriction.startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    await restriction.save();

    const populated = await populateRoomTypes(
      RoomRestriction.findById(restriction._id),
    );

    res.status(200).json({
      success: true,
      message: "Restriction updated successfully",
      data: sendRestriction(populated),
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message:
        error.code === 11000
          ? "Restriction code already exists"
          : error.message,
    });
  }
};

// TOGGLE STATUS
exports.toggleRestrictionStatus = async (req, res) => {
  try {
    const restriction = await RoomRestriction.findById(req.params.id);

    if (!restriction) {
      return res.status(404).json({
        success: false,
        message: "Restriction not found",
      });
    }

    restriction.status =
      restriction.status === "Active" ? "Inactive" : "Active";

    await restriction.save();

    const populated = await populateRoomTypes(
      RoomRestriction.findById(restriction._id),
    );

    res.status(200).json({
      success: true,
      message: `Restriction ${restriction.status.toLowerCase()} successfully`,
      data: sendRestriction(populated),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE RESTRICTION
exports.deleteRestriction = async (req, res) => {
  try {
    const restriction = await RoomRestriction.findByIdAndDelete(req.params.id);

    if (!restriction) {
      return res.status(404).json({
        success: false,
        message: "Restriction not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Restriction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
