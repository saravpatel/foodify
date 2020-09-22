const mongoose = require('mongoose');
const orderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    orderTime: String,
    orderDetails: String,
    orderTotal: String,
    orderStatus: String,
});
module.exports = mongoose.model('Order', orderSchema);
