const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { logActivity } = require('../utils/logActivity');
const asyncHandler = require('express-async-handler');

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Operator/Admin
const createSale = asyncHandler(async (req, res) => {
  const { items, total, paymentMethod } = req.body;
  const user = req.user;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Sale must include at least one item.');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product with ID ${item.product} not found.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}.`);
      }

      product.stock -= item.quantity;
      await product.save({ session });
    }

    const sale = new Sale({
      items,
      total,
      paymentMethod,
      user: user.id,
    });

    const createdSale = await sale.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logActivity('Sale', createdSale._id, 'create', req.user._id, { total: createdSale.total });

    res.status(201).json(createdSale);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400);
    throw new Error(error.message || 'Transaction failed. Please try again.');
  }
});

// @desc    Get all sales
// @route   GET /api/sales
// @access  Operator/Admin
const getSales = asyncHandler(async (req, res) => {
  const sales = await Sale.find({})
    .populate('user', 'username')
    .populate('items.product', 'name')
    .sort({ createdAt: -1 });
  res.json(sales);
});

// @desc    Get sale by ID
// @route   GET /api/sales/:id
// @access  Operator/Admin
const getSaleById = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id)
    .populate('user', 'username')
    .populate('items.product', 'name category');

  if (sale) {
    res.json(sale);
  } else {
    res.status(404);
    throw new Error('Sale not found');
  }
});

// @desc    Update a sale (e.g., payment method)
// @route   PUT /api/sales/:id
// @access  Admin
const updateSale = asyncHandler(async (req, res) => {
  const { paymentMethod } = req.body;
  const sale = await Sale.findById(req.params.id);

  if (sale) {
    sale.paymentMethod = paymentMethod || sale.paymentMethod;
    // Note: Updating items/total is complex due to stock management and is disallowed.
    // This is primarily for administrative fixes like correcting a payment method.

    const updatedSale = await sale.save();
    await logActivity('Sale', updatedSale._id, 'update', req.user._id, { paymentMethod: updatedSale.paymentMethod });
    res.json(updatedSale);
  } else {
    res.status(404);
    throw new Error('Sale not found');
  }
});

// @desc    Delete a sale and restock items
// @route   DELETE /api/sales/:id
// @access  Admin
const deleteSale = asyncHandler(async (req, res) => {
  const sale = await Sale.findById(req.params.id);

  if (!sale) {
    res.status(404);
    throw new Error('Sale not found');
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Restock items
    for (const item of sale.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    await sale.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    await logActivity('Sale', req.params.id, 'delete', req.user._id, { total: sale.total });

    res.json({ message: 'Sale removed and items restocked' });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500);
    throw new Error('Failed to delete sale and restock items. Please try again.');
  }
});


module.exports = {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
};
