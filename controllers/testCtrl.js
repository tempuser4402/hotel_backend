const Test = require("../models/testModel");

// CREATE PARAGRAPH
const createTest = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const paragraph = await Test.create({
      content: content,
    });

    res.status(201).json({
      success: true,
      message: "Paragraph created successfully",
      data: paragraph,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

// GET PARAGRAPHS
const getParagraphs = async (req, res) => {
  try {
    const paragraphs = await Test.find().sort({ _id: -1 });

    res.status(200).json({
      success: true,
      message: "Paragraphs retrieved successfully",
      count: paragraphs.length,
      data: paragraphs,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  createTest,
  getParagraphs,
};