const Floor = require("../../models/rooms/Floor");
const Room = require("../../models/rooms/Room");

// Helper: validate floor number
const isValidFloorNumber = (number) =>
  number !== null &&
  number !== undefined &&
  String(number).trim() !== "" &&
  Number.isInteger(Number(number)) &&
  Number(number) >= 1;

// Helper: handle MongoDB duplicate key errors
const handleFloorError = (error, res) => {
  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This floor number already exists.",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Something went wrong.",
  });
};

// Helper: To find the first available floor number
const getNextFloorNumber = async () => {
  const floors = await Floor.find({})
    .select("number")
    .sort({ number: 1 })
    .lean();

  let nextNumber = 1;

  for (const floor of floors) {
    if (floor.number === nextNumber) {
      nextNumber++;
    } else if (floor.number > nextNumber) {
      break;
    }
  }

  return nextNumber;
};

// GET ALL FLOORS
exports.getFloors = async (req, res) => {
  try {
    const floors = await Floor.find().sort({ number: 1 }).lean();

    const roomCounts = await Room.aggregate([
      {
        $match: {
          isActive: true,
        },
      },
      {
        $group: {
          _id: "$floor",
          count: { $sum: 1 },
        },
      },
    ]);

    const countMap = new Map(
      roomCounts.map((item) => [String(item._id), item.count]),
    );

    const formattedFloors = floors.map((floor) => ({
      ...floor,
      id: String(floor._id),
      roomCount: countMap.get(String(floor._id)) || 0,
    }));

    return res.status(200).json({
      success: true,
      count: formattedFloors.length,
      data: formattedFloors,
    });
  } catch (error) {
    return handleFloorError(error, res);
  }
};

// GET FLOOR BY ID
exports.getFloorById = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id).lean();

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "Floor not found.",
      });
    }

    const rooms = await Room.find({
      floor: floor._id,
      isActive: true,
    })
      .populate("roomType", "name code defaultPrice")
      .sort({ position: 1, roomNumber: 1 })
      .lean();

    const formattedRooms = rooms.map((room) => ({
      ...room,
      id: String(room._id),
      number: room.roomNumber,
      type: room.roomType?.name || "",
      rate: room.currentPrice,
    }));

    return res.status(200).json({
      success: true,
      data: {
        ...floor,
        id: String(floor._id),
        roomCount: formattedRooms.length,
        rooms: formattedRooms,
      },
    });
  } catch (error) {
    return handleFloorError(error, res);
  }
};

// CREATE FLOOR
exports.createFloor = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Floor name is required.",
      });
    }

    // Backend automatically assigns the first available number.
    const number = await getNextFloorNumber();

    const floor = await Floor.create({
      number,
      name: name.trim(),
      description: description?.trim() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Floor created successfully.",
      data: floor,
    });
  } catch (error) {
    return handleFloorError(error, res);
  }
};

// UPDATE FLOOR
exports.updateFloor = async (req, res) => {
  try {
    const { number, name, description, isActive } = req.body;

    const floor = await Floor.findById(req.params.id);

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "Floor not found.",
      });
    }

    // Validate number only when supplied
    if (number !== undefined) {
      if (!isValidFloorNumber(number)) {
        return res.status(400).json({
          success: false,
          message: "Floor number must be a non-negative integer.",
        });
      }

      const floorNumber = Number(number);

      const duplicate = await Floor.findOne({
        number: floorNumber,
        _id: { $ne: floor._id },
      });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: "This floor number already exists.",
        });
      }

      floor.number = floorNumber;
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Floor name cannot be empty.",
        });
      }

      floor.name = name.trim();
    }

    if (description !== undefined) {
      floor.description = description.trim();
    }

    if (isActive !== undefined) {
      floor.isActive = isActive;
    }

    await floor.save();

    return res.status(200).json({
      success: true,
      message: "Floor updated successfully.",
      data: {
        ...floor.toObject(),
        id: String(floor._id),
      },
    });
  } catch (error) {
    return handleFloorError(error, res);
  }
};

// DELETE FLOOR
exports.deleteFloor = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);

    if (!floor) {
      return res.status(404).json({
        success: false,
        message: "Floor not found.",
      });
    }

    // Do not delete a floor if any room is assigned to it
    const assignedRooms = await Room.countDocuments({
      floor: floor._id,
    });

    if (assignedRooms > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete this floor. ${assignedRooms} room(s) are assigned to it.`,
      });
    }

    await floor.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Floor deleted successfully.",
    });
  } catch (error) {
    return handleFloorError(error, res);
  }
};
