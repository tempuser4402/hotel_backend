const Amenity = require("../../models/rooms/Amenity");
const RoomType = require("../../models/rooms/RoomType");

exports.getAmenities = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) filter.category = req.query.category;
    if (req.query.status === "active") filter.isActive = true;
    if (req.query.status === "inactive") filter.isActive = false;

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { code: { $regex: req.query.search, $options: "i" } },
        { category: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const amenities = await Amenity.find(filter).sort({ category: 1, name: 1 });

    res.status(200).json({
      success: true,
      count: amenities.length,
      data: amenities.map((item) => ({
        ...item.toObject(),
        id: String(item._id),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAmenity = async (req, res) => {
  try {
    const { code, name, category, icon, description } = req.body;

    if (!code?.trim() || !name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Amenity code and name are required",
      });
    }

    const amenity = await Amenity.create({
      code,
      name,
      category,
      icon,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Amenity created successfully",
      data: { ...amenity.toObject(), id: String(amenity._id) },
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 500).json({
      success: false,
      message:
        error.code === 11000
          ? "Amenity code already exists"
          : error.message,
    });
  }
};

exports.updateAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Amenity updated successfully",
      data: { ...amenity.toObject(), id: String(amenity._id) },
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message: error.message,
    });
  }
};

exports.toggleAmenityStatus = async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    amenity.isActive = !amenity.isActive;
    await amenity.save();

    res.status(200).json({
      success: true,
      message: `Amenity ${amenity.isActive ? "activated" : "deactivated"}`,
      data: amenity,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id);

    if (!amenity) {
      return res.status(404).json({
        success: false,
        message: "Amenity not found",
      });
    }

    await RoomType.updateMany(
      { amenityIds: amenity._id },
      { $pull: { amenityIds: amenity._id } }
    );

    await amenity.deleteOne();

    res.status(200).json({
      success: true,
      message: "Amenity deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};