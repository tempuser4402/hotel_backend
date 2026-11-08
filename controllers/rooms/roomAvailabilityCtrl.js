const Room = require("../../models/rooms/Room");
const RoomBlock = require("../../models/rooms/RoomBlock");

const toStartOfDay = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

const toEndOfDay = (value) => {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
};

exports.getRoomAvailability = async (req, res) => {
  try {
    const { startDate, endDate, floor, roomType } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const start = toStartOfDay(startDate);
    const end = toEndOfDay(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "endDate cannot be before startDate",
      });
    }

    const roomFilter = { isActive: true };
    if (floor) roomFilter.floor = floor;
    if (roomType) roomFilter.roomType = roomType;

    const rooms = await Room.find(roomFilter)
      .populate("roomType", "name code")
      .populate("floor", "number name")
      .sort({ floor: 1, position: 1 });

    const blocks = await RoomBlock.find({
      status: "Blocked",
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    const blocksByRoom = new Map();

    blocks.forEach((block) => {
      const key = String(block.room);
      if (!blocksByRoom.has(key)) blocksByRoom.set(key, []);
      blocksByRoom.get(key).push(block);
    });

    const data = rooms.map((room) => {
      const roomBlocks = blocksByRoom.get(String(room._id)) || [];

      return {
        id: String(room._id),
        roomId: String(room._id),
        roomNumber: room.roomNumber,
        number: room.roomNumber,
        roomType: room.roomType?.name || "",
        floor: room.floor?.number ?? null,
        floorName: room.floor?.name || "",
        capacity: room.capacity,
        status: room.status,
        blocks: roomBlocks.map((block) => ({
          id: String(block._id),
          startDate: block.startDate,
          endDate: block.endDate,
          reason: block.reason,
          status: block.status,
        })),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        startDate: start,
        endDate: end,
        rooms: data,
      },
      message:
        "Availability returned with room blocks. Reservation occupancy integration is pending.",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRoomBlock = async (req, res) => {
  try {
    const {
      room,
      roomId,
      startDate,
      endDate,
      reason,
      blockType,
      notes,
    } = req.body;

    const selectedRoomId = room || roomId;

    if (!selectedRoomId || !startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Room, dates and reason are required",
      });
    }

    const start = toStartOfDay(startDate);
    const end = toEndOfDay(endDate);

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    const selectedRoom = await Room.findById(selectedRoomId);

    if (!selectedRoom || !selectedRoom.isActive) {
      return res.status(404).json({
        success: false,
        message: "Active room not found",
      });
    }

    if (selectedRoom.status === "Occupied" || selectedRoom.status === "Reserved") {
      return res.status(400).json({
        success: false,
        message: "Occupied or reserved rooms cannot be blocked",
      });
    }

    const overlappingBlock = await RoomBlock.findOne({
      room: selectedRoomId,
      status: "Blocked",
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    if (overlappingBlock) {
      return res.status(409).json({
        success: false,
        message: "This room already has an overlapping block",
      });
    }

    const block = await RoomBlock.create({
      code: `BL-${Date.now()}`,
      room: selectedRoomId,
      startDate: start,
      endDate: end,
      reason: reason.trim(),
      blockType: blockType || "Maintenance",
      notes: notes || "",
      createdBy: req.user?._id || null,
    });

    res.status(201).json({
      success: true,
      message: "Room blocked successfully",
      data: {
        ...block.toObject(),
        id: String(block._id),
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getRoomBlocks = async (req, res) => {
  try {
    const filter = {};

    if (req.query.roomId) filter.room = req.query.roomId;
    if (req.query.status) filter.status = req.query.status;

    const blocks = await RoomBlock.find(filter)
      .populate("room", "roomNumber")
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      count: blocks.length,
      data: blocks.map((block) => ({
        ...block.toObject(),
        id: String(block._id),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.releaseRoomBlock = async (req, res) => {
  try {
    const block = await RoomBlock.findById(req.params.id);

    if (!block) {
      return res.status(404).json({
        success: false,
        message: "Room block not found",
      });
    }

    if (block.status !== "Blocked") {
      return res.status(400).json({
        success: false,
        message: "This block is already released or cancelled",
      });
    }

    block.status = "Released";
    block.releasedAt = new Date();
    block.releasedBy = req.user?._id || null;

    await block.save();

    res.status(200).json({
      success: true,
      message: "Room block released successfully",
      data: block,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};