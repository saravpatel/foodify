const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: String,
    password: String,
    name: String,
    address: String,
    mobile: String,
    description: String,
    cuisine: String
});
module.exports = mongoose.model('User', userSchema);