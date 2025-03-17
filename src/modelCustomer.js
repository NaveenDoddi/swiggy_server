const mongoose = require('mongoose');


const customer = mongoose.Schema({
    username: { type: String, required: true, unique: true},
    email: {type: String, required: true},
    mobile: {type: Number, required: true, unique: true},
    address: {type: String},
    orders: {type : Array}
})

module.exports = mongoose.model("customers", customer)