const Room = require("../../models/rooms/Room");
const Floor = require("../../models/rooms/Floor");
const RoomType = require("../../models/rooms/RoomType");
const RoomStatusHistory = require("../../models/rooms/RoomStatusHistory");

const roomPopulate = [
  { path: "roomType", select: "name code defaultPrice basePrice" },
  { path: "floor", select: "number name" },
];

const formatRoom = (room) => {
  const data = room.toObject ? room.toObject() : room;

  return {
    ...data,
    id: String(data._id),
    number: data.roomNumber,
    type: data.roomType?.name || "",
    rate: data.currentPrice,
    floorNumber: data.floor?.number ?? null,
  };
};

exports.getRooms = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.housekeeping) {
      filter.housekeepingStatus = req.query.housekeeping;
    }
    if (req.query.maintenance) {
      filter.maintenanceStatus = req.query.maintenance;
    }
    if (req.query.floor) filter.floor = req.query.floor;
    if (req.query.roomType) filter.roomType = req.query.roomType;

    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;
    if (!req.query.active && req.query.showInactive !== "true") {
      filter.isActive = true;
    }

    if (req.query.search) {
      filter.roomNumber = {
        $regex: req.query.search,
        $options: "i",
      };
    }

    const rooms = await Room.find(filter)
      .populate(roomPopulate)
      .sort({ roomNumber: 1 });

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms.map(formatRoom),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate(roomPopulate);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const history = await RoomStatusHistory.find({ room: room._id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      data: {
        ...formatRoom(room),
        statusHistory: history,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const {
      roomNumber,
      number,
      roomType,
      typeId,
      floor,
      capacity,
      currentPrice,
      rate,
      status,
      housekeepingStatus,
      housekeeping,
      maintenanceStatus,
      maintenance,
      facilities,
      notes,
      wing,
      position,
    } = req.body;

    const finalRoomNumber = roomNumber || number;
    const finalRoomType = roomType || typeId;

    if (!finalRoomNumber || !finalRoomType || !floor) {
      return res.status(400).json({
        success: false,
        message: "Room number, room type and floor are required",
      });
    }

    const [existingRoom, validFloor, validRoomType] = await Promise.all([
      Room.findOne({ roomNumber: String(finalRoomNumber).trim() }),
      Floor.findById(floor),
      RoomType.findById(finalRoomType),
    ]);

    if (existingRoom) {
      return res.status(409).json({
        success: false,
        message: "Room number already exists",
      });
    }

    if (!validFloor || !validFloor.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected floor does not exist or is inactive",
      });
    }

    if (!validRoomType || !validRoomType.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected room type does not exist or is inactive",
      });
    }

    const lastRoom = await Room.findOne({ floor })
      .sort({ position: -1 })
      .select("position");

    const room = await Room.create({
      roomNumber: String(finalRoomNumber).trim(),
      roomType: finalRoomType,
      floor,
      capacity: capacity ?? validRoomType.maxOccupancy,
      currentPrice: currentPrice ?? rate ?? validRoomType.defaultPrice,
      status: status || "Available",
      housekeepingStatus: housekeepingStatus || housekeeping || "Clean",
      maintenanceStatus: maintenanceStatus || maintenance || "Normal",
      facilities: facilities || [],
      notes: notes || "",
      wing: wing || "",
      position: position ?? (lastRoom ? lastRoom.position + 1 : 0),
    });

    const populatedRoom = await Room.findById(room._id).populate(roomPopulate);

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: formatRoom(populatedRoom),
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message:
        error.code === 11000 ? "Room number already exists" : error.message,
    });
  }
};

exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const body = req.body;

    const nextRoomNumber = body.roomNumber ?? body.number;

    if (nextRoomNumber !== undefined) {
      const duplicate = await Room.findOne({
        roomNumber: String(nextRoomNumber).trim(),
        _id: { $ne: room._id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "Room number already exists",
        });
      }

      room.roomNumber = String(nextRoomNumber).trim();
    }

    const nextRoomType = body.roomType || body.typeId;

    if (nextRoomType) {
      const validType = await RoomType.findById(nextRoomType);

      if (!validType || !validType.isActive) {
        return res.status(400).json({
          success: false,
          message: "Selected room type does not exist or is inactive",
        });
      }

      room.roomType = nextRoomType;

      if (body.capacity === undefined) {
        room.capacity = validType.maxOccupancy;
      }

      if (body.currentPrice === undefined && body.rate === undefined) {
        room.currentPrice = validType.defaultPrice;
      }
    }

    if (body.floor) {
      const validFloor = await Floor.findById(body.floor);

      if (!validFloor || !validFloor.isActive) {
        return res.status(400).json({
          success: false,
          message: "Selected floor does not exist or is inactive",
        });
      }

      if (String(room.floor) !== String(body.floor)) {
        const lastRoom = await Room.findOne({ floor: body.floor })
          .sort({ position: -1 })
          .select("position");

        room.floor = body.floor;
        room.position = lastRoom ? lastRoom.position + 1 : 0;
      }
    }

    const fieldMap = {
      capacity: "capacity",
      currentPrice: "currentPrice",
      rate: "currentPrice",
      status: "status",
      housekeepingStatus: "housekeepingStatus",
      housekeeping: "housekeepingStatus",
      maintenanceStatus: "maintenanceStatus",
      maintenance: "maintenanceStatus",
      facilities: "facilities",
      notes: "notes",
      wing: "wing",
      position: "position",
      isActive: "isActive",
    };

    const historyEntries = [];

    for (const [inputField, modelField] of Object.entries(fieldMap)) {
      if (body[inputField] === undefined) continue;

      const newValue = body[inputField];

      if (
        ["status", "housekeepingStatus", "maintenanceStatus"].includes(
          modelField,
        ) &&
        String(room[modelField]) !== String(newValue)
      ) {
        historyEntries.push({
          room: room._id,
          field: modelField,
          previousValue: String(room[modelField]),
          newValue: String(newValue),
          reason: body.reason || "",
          changedBy: req.user?._id || null,
        });
      }

      room[modelField] = newValue;
    }

    await room.save();

    if (historyEntries.length) {
      await RoomStatusHistory.insertMany(historyEntries);
    }

    const populatedRoom = await Room.findById(room._id).populate(roomPopulate);

    res.status(200).json({
      success: true,
      message: "Room updated successfully",
      data: formatRoom(populatedRoom),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateRoomStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;

    const allowedStatuses = [
      "Available",
      "Occupied",
      "Reserved",
      "Cleaning",
      "Maintenance",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid room status",
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const previousValue = room.status;
    room.status = status;
    await room.save();

    if (previousValue !== status) {
      await RoomStatusHistory.create({
        room: room._id,
        field: "status",
        previousValue,
        newValue: status,
        reason: reason || "",
        changedBy: req.user?._id || null,
      });
    }

    const populatedRoom = await Room.findById(room._id).populate(roomPopulate);

    res.status(200).json({
      success: true,
      message: "Room status updated successfully",
      data: formatRoom(populatedRoom),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateHousekeepingStatus = async (req, res) => {
  try {
    const { housekeepingStatus, reason } = req.body;

    const allowed = ["Clean", "Dirty", "In Progress", "Inspected"];

    if (!allowed.includes(housekeepingStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid housekeeping status",
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const previousValue = room.housekeepingStatus;
    room.housekeepingStatus = housekeepingStatus;

    await room.save();

    if (previousValue !== housekeepingStatus) {
      await RoomStatusHistory.create({
        room: room._id,
        field: "housekeepingStatus",
        previousValue,
        newValue: housekeepingStatus,
        reason: reason || "",
        changedBy: req.user?._id || null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Housekeeping status updated",
      data: formatRoom(await Room.findById(room._id).populate(roomPopulate)),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateMaintenanceStatus = async (req, res) => {
  try {
    const { maintenanceStatus, reason } = req.body;

    const allowed = [
      "Normal",
      "Pending",
      "In Progress",
      "Completed",
      "Repair required",
      "Under Maintenance",
    ];

    if (!allowed.includes(maintenanceStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid maintenance status",
      });
    }

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const previousValue = room.maintenanceStatus;
    room.maintenanceStatus = maintenanceStatus;

    if (
      [
        "Pending",
        "In Progress",
        "Repair required",
        "Under Maintenance",
      ].includes(maintenanceStatus)
    ) {
      room.status = "Maintenance";
    }

    await room.save();

    if (previousValue !== maintenanceStatus) {
      await RoomStatusHistory.create({
        room: room._id,
        field: "maintenanceStatus",
        previousValue,
        newValue: maintenanceStatus,
        reason: reason || "",
        changedBy: req.user?._id || null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Maintenance status updated",
      data: formatRoom(await Room.findById(room._id).populate(roomPopulate)),
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.toggleRoomStatus = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    room.isActive = !room.isActive;
    await room.save();

    res.status(200).json({
      success: true,
      message: `Room ${room.isActive ? "activated" : "deactivated"} successfully`,
      data: formatRoom(await Room.findById(room._id).populate(roomPopulate)),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    if (room.status === "Occupied" || room.status === "Reserved") {
      return res.status(400).json({
        success: false,
        message: "Occupied or reserved rooms cannot be deleted",
      });
    }

    await room.deleteOne();

    res.status(200).json({
      success: true,
      message: "Room deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Floor Plan: save all room positions in one request.
exports.updateRoomPositions = async (req, res) => {
  try {
    const { positions } = req.body;

    if (!Array.isArray(positions) || positions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Positions array is required",
      });
    }

    const operations = positions.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { position: Number(item.position) } },
      },
    }));

    await Room.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: "Room positions updated successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.resetRoomPositions = async (req, res) => {
  try {
    const { floorId } = req.params;

    const rooms = await Room.find({ floor: floorId }).sort({
      roomNumber: 1,
    });

    const operations = rooms.map((room, index) => ({
      updateOne: {
        filter: { _id: room._id },
        update: { $set: { position: index } },
      },
    }));

    if (operations.length) await Room.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: "Floor room positions reset successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get Room Overview / Dashboard Statistics
exports.getRoomOverview = async (req, res) => {
  try {
    const [
      totalRooms,
      activeRooms,
      inactiveRooms,
      statusCounts,
      housekeepingCounts,
      maintenanceCounts,
      roomTypeCounts,
      floorCounts,
      activeRoomTypes,
      activeFloors,
    ] = await Promise.all([
      Room.countDocuments(),
      Room.countDocuments({ isActive: true }),
      Room.countDocuments({ isActive: false }),

      Room.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Room.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$housekeepingStatus", count: { $sum: 1 } } },
      ]),

      Room.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$maintenanceStatus", count: { $sum: 1 } } },
      ]),

      Room.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$roomType", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "roomtypes",
            localField: "_id",
            foreignField: "_id",
            as: "roomType",
          },
        },
        { $unwind: "$roomType" },
        {
          $project: {
            _id: 1,
            count: 1,
            name: "$roomType.name",
            code: "$roomType.code",
          },
        },
      ]),

      Room.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$floor", count: { $sum: 1 } } },
        {
          $lookup: {
            from: "floors",
            localField: "_id",
            foreignField: "_id",
            as: "floor",
          },
        },
        { $unwind: "$floor" },
        {
          $project: {
            _id: 1,
            count: 1,
            number: "$floor.number",
            name: "$floor.name",
          },
        },
        { $sort: { number: 1 } },
      ]),

      RoomType.countDocuments({ isActive: true }),
      Floor.countDocuments({ isActive: true }),
    ]);

    const toObject = (items) =>
      Object.fromEntries(items.map((item) => [item._id, item.count]));

    const getCount = (items, status) =>
      items.find((item) => item._id === status)?.count || 0;

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalRooms,
          activeRooms,
          inactiveRooms,
          available: getCount(statusCounts, "Available"),
          occupied: getCount(statusCounts, "Occupied"),
          reserved: getCount(statusCounts, "Reserved"),
          cleaning: getCount(statusCounts, "Cleaning"),
          maintenance: getCount(statusCounts, "Maintenance"),
          activeRoomTypes,
          activeFloors,
        },

        statusBreakdown: toObject(statusCounts),
        housekeepingBreakdown: toObject(housekeepingCounts),
        maintenanceBreakdown: toObject(maintenanceCounts),
        roomTypeBreakdown: roomTypeCounts,
        floorBreakdown: floorCounts,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
