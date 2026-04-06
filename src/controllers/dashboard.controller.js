const FinancialRecord = require("../models/record.model");

// GET /api/dashboard/summary
// returns total income, total expense and net balance
const getSummary = async (req, res) => {
  try {
    const result = await FinancialRecord.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id:   "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const summary = {
      totalIncome:  0,
      totalExpense: 0,
      incomeCount:  0,
      expenseCount: 0,
    };

    result.forEach((item) => {
      if (item._id === "income") {
        summary.totalIncome  = item.total;
        summary.incomeCount  = item.count;
      } else if (item._id === "expense") {
        summary.totalExpense = item.total;
        summary.expenseCount = item.count;
      }
    });

    summary.netBalance   = summary.totalIncome - summary.totalExpense;
    summary.totalRecords = summary.incomeCount + summary.expenseCount;

    return res.status(200).json({ success: true, data: summary });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/by-category
// returns totals grouped by category and type, sorted by total descending
const getCategoryTotals = async (req, res) => {
  try {
    const result = await FinancialRecord.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id:   { category: "$category", type: "$type" },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      {
        $project: {
          _id:      0,
          category: "$_id.category",
          type:     "$_id.type",
          total:    1,
          count:    1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      count:   result.length,
      data:    { categoryTotals: result },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/monthly-trends?year=2024
// returns month-by-month income and expense breakdown for charting
const getMonthlyTrends = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const result = await FinancialRecord.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31T23:59:59`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            type:  "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun",
                    "Jul","Aug","Sep","Oct","Nov","Dec"];

    // build a full 12-month array with zeros as defaults
    const trends = MONTHS.map((name, i) => ({
      month:     i + 1,
      monthName: name,
      income:    0,
      expense:   0,
      net:       0,
    }));

    result.forEach(({ _id: { month, type }, total }) => {
      const idx = month - 1;
      if (type === "income")  trends[idx].income  = total;
      if (type === "expense") trends[idx].expense = total;
    });

    trends.forEach((m) => { m.net = m.income - m.expense; });

    return res.status(200).json({
      success: true,
      year,
      data: { monthlyTrends: trends },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/dashboard/recent?limit=10
// returns latest N transactions for the activity feed
const getRecentActivity = async (req, res) => {
  try {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const records = await FinancialRecord.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("amount type category date notes createdBy createdAt");

    return res.status(200).json({
      success: true,
      count:   records.length,
      data:    { records },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSummary, getCategoryTotals, getMonthlyTrends, getRecentActivity };
