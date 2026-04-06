const FinancialRecord = require("../models/record.model");

// POST /api/records
const createRecord = async (req, res) => {
  try {
    const { amount, type, category, date, notes } = req.body;

    const record = await FinancialRecord.create({
      amount,
      type,
      category,
      date: date || Date.now(),
      notes,
      createdBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Record created successfully.",
      data: { record },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/records
// supports filtering by type, category, date range, search and pagination
const getAllRecords = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page, limit, search } = req.query;

    const filter = {};

    if (type)     filter.type     = type;
    if (category) filter.category = category;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate)   filter.date.$lte = new Date(endDate);
    }

    // partial case-insensitive search on the notes field
    if (search) {
      filter.notes = { $regex: search.trim(), $options: "i" };
    }

    const pageNum  = Math.max(1, parseInt(page)  || 1);
    const limitNum = Math.min(100, parseInt(limit) || 10);
    const skip     = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      FinancialRecord.find(filter)
        .populate("createdBy", "name email")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
      FinancialRecord.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      total,
      count:      records.length,
      page:       pageNum,
      totalPages: Math.ceil(total / limitNum),
      data:       { records },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/records/:id
const getRecord = async (req, res) => {
  try {
    const record = await FinancialRecord
      .findById(req.params.id)
      .populate("createdBy", "name email");

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    return res.status(200).json({ success: true, data: { record } });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid record ID format." });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/records/:id
const updateRecord = async (req, res) => {
  try {
    // strip createdBy and isDeleted to prevent unauthorized field updates
    const { createdBy, isDeleted, ...updateData } = req.body;

    const record = await FinancialRecord.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Record updated successfully.",
      data: { record },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid record ID format." });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE /api/records/:id
// soft delete — sets isDeleted flag instead of removing from DB
const deleteRecord = async (req, res) => {
  try {
    // bypass the pre-find hook by using findOneAndUpdate directly
    const record = await FinancialRecord.findOneAndUpdate(
      { _id: req.params.id },
      { isDeleted: true },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Record deleted successfully.",
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid record ID format." });
    }
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { createRecord, getAllRecords, getRecord, updateRecord, deleteRecord };
