const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Court = require('../models/Court');

// @desc    Get aggregated data for the main dashboard
// @route   GET /api/reports/dashboard
// @access  Admin
const getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // 1. Daily Revenue (from sales and paid bookings)
    const salesToday = await Sale.aggregate([
      { $match: { createdAt: { $gte: startOfToday, $lte: endOfToday } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);
    const bookingsToday = await Booking.aggregate([
      { $match: { startTime: { $gte: startOfToday, $lte: endOfToday }, isPaid: true } },
      { $group: { _id: null, total: { $sum: '$price' } } },
    ]);
    const dailyRevenue = (salesToday[0]?.total || 0) + (bookingsToday[0]?.total || 0);

    // 2. Upcoming Bookings (for the next 24 hours)
    const upcomingBookings = await Booking.find({
      startTime: { $gte: new Date(), $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) },
      status: 'Confirmed',
    }).populate('court', 'name').sort({ startTime: 1 }).limit(5);

    // 3. Low Stock Products
    const lowStockProducts = await Product.find({
      trackStockAlert: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    }).limit(5);

    res.json({
      dailyRevenue,
      upcomingBookings,
      lowStockProducts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get daily revenue for the last 30 days
// @route   GET /api/reports/revenue-last-30-days
// @access  Admin
const getRevenueLast30Days = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sales = await Sale.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    total: { $sum: '$total' },
                },
            },
            { $sort: { _id: 1 } },
        ]);
        
        // This report could be enhanced to include paid bookings as well.
        res.json(sales);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get top 5 best-selling products
// @route   GET /api/reports/top-selling-products
// @access  Admin
const getTopSellingProducts = async (req, res) => {
    try {
        const topProducts = await Sale.aggregate([
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.product',
                    name: { $first: '$items.name' },
                    totalQuantity: { $sum: '$items.quantity' },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
        ]);
        res.json(topProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get booking hours per court for a date range
// @route   GET /api/reports/court-occupancy
// @access  Admin
const getCourtOccupancy = async (req, res) => {
    try {
        const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();

        const occupancy = await Booking.aggregate([
            { $match: { startTime: { $gte: startDate, $lte: endDate }, status: 'Confirmed' } },
            {
                $group: {
                    _id: '$court',
                    totalHours: {
                        $sum: {
                            $divide: [{ $subtract: ['$endTime', '$startTime'] }, 1000 * 60 * 60],
                        },
                    },
                },
            },
            {
                $lookup: {
                    from: 'courts',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'courtInfo',
                },
            },
            { $unwind: '$courtInfo' },
            { $project: { name: '$courtInfo.name', totalHours: 1, _id: 0 } }
        ]);
        res.json(occupancy);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
  getDashboardData,
  getRevenueLast30Days,
  getTopSellingProducts,
  getCourtOccupancy,
};
