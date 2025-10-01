const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { logActivity } = require('../utils/logActivity');

// @desc    Create a new sale
// @route   POST /api/sales
// @access  Operator/Admin
const createSale = async (req, res) => {
  const { items, total, paymentMethod } = req.body;
  const user = req.user;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Sale must include at least one item.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    for (const item of items) {
      const product = await Product.findById(item.productId).session(session);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}.`);
      }

      product.stock -= item.quantity;
      await product.save({ session });
    }

    const sale = new Sale({
      items: items.map(item => ({
          product: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price
      })),
      total,
      paymentMethod,
      user: user.id,
    });

    const createdSale = await sale.save({ session });

    await session.commitTransaction();
    
    const logDetails = `Sale of ${total.toFixed(2)} ARS registered by user '${user.username}'.`;
    await logActivity(user, 'SALE_REGISTERED', logDetails);
    
    session.endSession();

    res.status(201).json(createdSale);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Transaction aborted:', error.message);
    res.status(400).json({ message: error.message || 'Transaction failed. Please try again.' });
  }
};


// @desc    Get all sales
// @route   GET /api/sales
// @access  Operator/Admin
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find({})
      .populate('user', 'username')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createSale,
  getSales,
};
