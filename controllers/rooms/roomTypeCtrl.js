const RoomType = require("../../models/rooms/RoomType");
const Room = require("../../models/rooms/Room");

exports.getRoomTypes = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status === "active") filter.isActive = true;
    if (req.query.status === "inactive") filter.isActive = false;

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { code: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const roomTypes = await RoomType.find(filter)
      .populate("amenityIds", "code name category icon")
      .sort({ createdAt: -1 })
      .lean();

    const counts = await Room.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$roomType", count: { $sum: 1 } } },
    ]);

    const countMap = new Map(
      counts.map((item) => [String(item._id), item.count]),
    );

    res.status(200).json({
      success: true,
      count: roomTypes.length,
      data: roomTypes.map((item) => ({
        ...item,
        id: String(item._id),
        roomCount: countMap.get(String(item._id)) || 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoomTypeById = async (req, res) => {
  try {
    const roomType = await RoomType.findById(req.params.id)
      .populate("amenityIds", "code name category icon")
      .lean();

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    const roomCount = await Room.countDocuments({
      roomType: roomType._id,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: {
        ...roomType,
        id: String(roomType._id),
        roomCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRoomType = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      maxAdults,
      maxChildren,
      maxOccupancy,
      bedConfiguration,
      bedType,
      bedCount,
      size,
      sizeUnit,
      defaultPrice,
      basePrice,
      amenities,
      amenityIds,
      image,
    } = req.body;

    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room type code and name are required",
      });
    }

    const roomType = await RoomType.create({
      code,
      name,
      description,
      maxAdults,
      maxChildren,
      maxOccupancy,
      bedConfiguration: bedConfiguration || bedType,
      bedType: bedType || bedConfiguration,
      bedCount,
      size,
      sizeUnit,
      defaultPrice: defaultPrice ?? basePrice ?? 0,
      basePrice: basePrice ?? defaultPrice ?? 0,
      amenities: amenities || [],
      amenityIds: amenityIds || [],
      image,
    });

    res.status(201).json({
      success: true,
      message: "Room type created successfully",
      data: { ...roomType.toObject(), id: String(roomType._id), roomCount: 0 },
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message:
        error.code === 11000 ? "Room type code already exists" : error.message,
    });
  }
};

exports.updateRoomType = async (req, res) => {
  try {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    const allowedFields = [
      "name",
      "code",
      "description",
      "maxAdults",
      "maxChildren",
      "maxOccupancy",
      "bedConfiguration",
      "bedType",
      "bedCount",
      "size",
      "sizeUnit",
      "defaultPrice",
      "basePrice",
      "amenities",
      "amenityIds",
      "image",
      "isActive",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        roomType[field] = req.body[field];
      }
    });

    await roomType.save();

    const roomCount = await Room.countDocuments({
      roomType: roomType._id,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      message: "Room type updated successfully",
      data: {
        ...roomType.toObject(),
        id: String(roomType._id),
        roomCount,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.toggleRoomTypeStatus = async (req, res) => {
  try {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    roomType.isActive = !roomType.isActive;
    await roomType.save();

    res.status(200).json({
      success: true,
      message: `Room type ${roomType.isActive ? "activated" : "deactivated"}`,
      data: roomType,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRoomType = async (req, res) => {
  try {
    const roomType = await RoomType.findById(req.params.id);

    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: "Room type not found",
      });
    }

    const assignedRooms = await Room.countDocuments({
      roomType: roomType._id,
    });

    if (assignedRooms > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a room type assigned to rooms. Deactivate it instead.",
      });
    }

    await roomType.deleteOne();

    res.status(200).json({
      success: true,
      message: "Room type deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
