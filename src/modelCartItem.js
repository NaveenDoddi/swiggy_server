const mongoose = require('mongoose');

const cartItem = mongoose.Schema({
    
    restaurant: { type: String, required: true},
    mobile: {type: Number, required: true},
    dishName: { type: String, required: true},
    price: {type: Number, required: true},
    discription: {type: String},
    image: {type: String}

})

module.exports = mongoose.model("cartItems", cartItem)