const mongoose = require('mongoose');

const restaurant = mongoose.Schema({
    name: { type: String, required: true},
    address: {type: String},
    email: {type: String, required: true, unique: true},
    mobile: {type: Number},
    username: { type: String, required: true},
    password: {type: String, required: true}
})

module.exports = mongoose.model("restaurants", restaurant)