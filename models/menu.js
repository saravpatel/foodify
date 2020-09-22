const mongoose = require('mongoose');
const menuSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String,
    price: Number,
    isAvailable: Boolean,
    restaurantId: mongoose.Schema.Types.ObjectId,
});
module.exports = mongoose.model('Menu', menuSchema);
