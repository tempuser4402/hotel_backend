const RatePlan = require("../../models/rooms/RatePlan");

exports.getRatePlans = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.type) filter.type = req.query.type;

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { code: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const plans = await RatePlan.find(filter)
      .populate("roomTypes", "name code")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans.map((plan) => ({
        ...plan.toObject(),
        id: String(plan._id),
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRatePlanById = async (req, res) => {
  try {
    const plan = await RatePlan.findById(req.params.id).populate(
      "roomTypes",
      "name code"
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Rate plan not found",
      });
    }

    res.status(200).json({
      success: true,
      data: { ...plan.toObject(), id: String(plan._id) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRatePlan = async (req, res) => {
  try {
    const {
      code,
      name,
      type,
      description,
      roomTypes,
      priceType,
      baseRate,
      adjustment,
      startDate,
      endDate,
      days,
      mealPlan,
      minStay,
      maxStay,
      cancellation,
    } = req.body;

    if (!code?.trim() || !name?.trim() || baseRate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Code, name and base rate are required",
      });
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    const plan = await RatePlan.create({
      code,
      name,
      type,
      description,
      roomTypes: roomTypes || [],
      priceType,
      baseRate,
      adjustment,
      startDate: startDate || null,
      endDate: endDate || null,
      days: days || [],
      mealPlan,
      minStay,
      maxStay,
      cancellation,
    });

    res.status(201).json({
      success: true,
      message: "Rate plan created successfully",
      data: { ...plan.toObject(), id: String(plan._id) },
    });
  } catch (error) {
    res.status(error.code === 11000 ? 409 : 400).json({
      success: false,
      message:
        error.code === 11000 ? "Rate plan code already exists" : error.message,
    });
  }
};

exports.updateRatePlan = async (req, res) => {
  try {
    const plan = await RatePlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Rate plan not found",
      });
    }

    const fields = [
      "name",
      "type",
      "description",
      "roomTypes",
      "priceType",
      "baseRate",
      "adjustment",
      "startDate",
      "endDate",
      "days",
      "mealPlan",
      "minStay",
      "maxStay",
      "cancellation",
      "status",
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        plan[field] = req.body[field];
      }
    });

    if (
      plan.startDate &&
      plan.endDate &&
      new Date(plan.endDate) < new Date(plan.startDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    await plan.save();

    res.status(200).json({
      success: true,
      message: "Rate plan updated successfully",
      data: { ...plan.toObject(), id: String(plan._id) },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.duplicateRatePlan = async (req, res) => {
  try {
    const original = await RatePlan.findById(req.params.id);

    if (!original) {
      return res.status(404).json({
        success: false,
        message: "Rate plan not found",
      });
    }

    const duplicateCode = `${original.code}-COPY-${Date.now()}`;

    const copy = await RatePlan.create({
      ...original.toObject(),
      _id: undefined,
      code: duplicateCode,
      name: `${original.name} (Copy)`,
      status: "Inactive",
    });

    res.status(201).json({
      success: true,
      message: "Rate plan duplicated successfully",
      data: { ...copy.toObject(), id: String(copy._id) },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.toggleRatePlanStatus = async (req, res) => {
  try {
    const plan = await RatePlan.findById(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Rate plan not found",
      });
    }

    plan.status = plan.status === "Active" ? "Inactive" : "Active";
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Rate plan ${plan.status.toLowerCase()} successfully`,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRatePlan = async (req, res) => {
  try {
    const plan = await RatePlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: "Rate plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Rate plan deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Preview the rate calculation without saving anything.
exports.calculateRate = async (req, res) => {
  try {
    const { baseRate, priceType, adjustment } = req.body;

    if (
      baseRate === undefined ||
      !["Fixed", "Percentage"].includes(priceType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid baseRate and priceType are required",
      });
    }

    const base = Number(baseRate);
    const change = Number(adjustment || 0);

    const finalRate =
      priceType === "Fixed"
        ? base + change
        : base + (base * change) / 100;

    res.status(200).json({
      success: true,
      data: {
        baseRate: base,
        adjustment: change,
        priceType,
        finalRate: Math.round(finalRate * 100) / 100,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};