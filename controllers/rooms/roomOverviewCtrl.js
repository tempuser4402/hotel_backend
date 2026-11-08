const Room = require("../../models/rooms/Room");
const RoomType = require("../../models/rooms/RoomType");
const Floor = require("../../models/rooms/Floor");
const RoomBlock = require("../../models/rooms/RoomBlock");

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
      activeBlocks,
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
        {
          $group: {
            _id: "$roomType",
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: "roomtypes",
            localField: "_id",
            foreignField: "_id",
            as: "roomType",
          },
        },
        { $unwind: { path: "$roomType", preserveNullAndEmptyArrays: true } },
        {
          $project: {
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
        { $unwind: { path: "$floor", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            count: 1,
            number: "$floor.number",
            name: "$floor.name",
          },
        },
        { $sort: { number: 1 } },
      ]),
      RoomType.countDocuments({ isActive: true }),
      Floor.countDocuments({ isActive: true }),
      RoomBlock.countDocuments({ status: "Blocked" }),
    ]);

    const toObject = (items) =>
      Object.fromEntries(items.map((item) => [item._id, item.count]));

    res.status(200).json({
      success: true,
      data: {
        totals: {
          totalRooms,
          activeRooms,
          inactiveRooms,
          available: statusCounts.find((x) => x._id === "Available")?.count || 0,
          occupied: statusCounts.find((x) => x._id === "Occupied")?.count || 0,
          reserved: statusCounts.find((x) => x._id === "Reserved")?.count || 0,
          cleaning: statusCounts.find((x) => x._id === "Cleaning")?.count || 0,
          maintenance:
            statusCounts.find((x) => x._id === "Maintenance")?.count || 0,
          activeRoomTypes,
          activeFloors,
          activeBlocks,
        },
        statusBreakdown: toObject(statusCounts),
        housekeepingBreakdown: toObject(housekeepingCounts),
        maintenanceBreakdown: toObject(maintenanceCounts),
        roomTypeBreakdown: roomTypeCounts,
        floorBreakdown: floorCounts,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};