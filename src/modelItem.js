const mongoose = require('mongoose');

const item = mongoose.Schema({
    
    restaurant: { type: String, required: true},
    email: {type: String, required: true},
    dishName: { type: String, required: true},
    price: {type: Number, required: true},
    discription: {type: String},
    pic: {type: String},
    category: {type: String}

})

module.exports = mongoose.model("items", item)


