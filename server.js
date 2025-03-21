const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

const items = require('./src/modelItem')
const restaurants = require("./src/modelRestraurant");
const customers = require("./src/modelCustomer");
const cartItems = require("./src/modelCartItem");

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// const mongoURI = process.env.MONGODB_URI;
const mongoURI = "mongodb+srv://naveendoddi:zQTrjUrwyKXeIEZ2@swiggy.jbdpwef.mongodb.net/swiggy?retryWrites=true&w=majority&appName=swiggy"
mongoose
      .connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
      })
      .then(() => console.log("DB connected...", mongoose.connection.name))
      .catch((err) => console.log(err));

app.post("/postCustomer", async (req, res) => {
      const { username, email, mobile, address } = req.body;
      try {
            const newData = new customers({ username, email, mobile, address });
            await newData.save();
            res.status(201).json({ message: "User registered successfully" });
      } catch (err) {
            res.status(400).json({ error: "exists" });
      }
});

app.post("/postRestaurant", async (req, res) => {
      const { name, address, email, mobile, username, password } = req.body;
      try {
            const newData = new restaurants({
                  name,
                  address,
                  email,
                  mobile,
                  username,
                  password,
            });
            await newData.save();
            res.status(201).json({ message: "Restaurant registered successfully" });
      } catch (err) {
            if (err.code == 11000 && err.keyPattern.email) {
                  res.status(400).json({ error: "exists" });
            } else {
                  console.error(err);
                  res.status(500).json({ error: "Internal server error" });
            }
      }
});

app.post("/postItem", async (req, res) => {
      const { restaurant, email, dishName, price, discription, pic } = req.body;
      try {
            const newData = new items({
                  restaurant,
                  email,
                  dishName,
                  price,
                  discription,
                  pic,
            });
            await newData.save();
            res.status(200).json({ message: "Item registered successfully", data: newData });
      } catch (err) {
            res.status(400);
      }
});

app.post("/addToCart", async (req, res) => {
      try {
            const { itemId, mobile } = req.body;

            // Find the item
            const item = await items.findById(itemId);

            if (!item) {
                  return res.status(404).json({ error: "Item not found" });
            }

            // Check if item is available
            if (item.count <= 0) {
                  return res.status(400).json({ error: "Item is out of stock" });
            }

            // Decrease item availability count
            await items.updateOne({ _id: itemId }, { $inc: { count: -1 } });

            // Add item to cart
            const newCartItem = new cartItems({
                  restaurant: item.restaurant,
                  mobile: mobile,
                  dishName: item.dishName,
                  price: item.price,
                  image: item.pic,
                  description: item.description
            });

            await newCartItem.save();

            res.status(200).json({
                  message: "Item added to cart successfully and availability updated",
            });
      } catch (error) {
            console.error("Error adding item to cart:", error);
            res.status(500).json({ error: "Internal server error" });
      }
});

app.post("/orderItem/:mobile", async (req, res) => {
      try {
            const mobile_number = req.params.mobile;
            const newOrder = req.body.newOrder;

            const updateResult = await customers.updateOne(
                  { mobile: mobile_number },
                  { $push: { orders: newOrder } }
            );

            res.json({
                  success: true,
                  message: "New item added to the array successfully",
                  data: updateResult,
            });
      } catch (error) {
            console.error("Error updating documents:", error);
            res.status(500).json({
                  success: false,
                  message: "An error occurred while updating documents",
            });
      }
});

app.get("/getCartItems/:mobile", async (req, res) => {
      try {
            const mobile = req.params.mobile;
            const allData = await cartItems.find({ mobile });
            return res.status(200).json(allData);
      } catch (err) {
            console.log(err);
      }
});

app.get("/getAllItems", async (req, res) => {
      try {
            let { page = 1, limit = 10, sortBy = "count", order = "desc" } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);

            const allData = await items.find()
                  .sort({ [sortBy]: order })
                  .skip((page - 1) * limit)
                  .limit(limit);

            res.status(200).json(allData);
      } catch (err) {
            console.log(err);
            res.status(500).json({ error: "Internal Server Error" });
      }
});


// app.get("/getAllItems", async (req, res) => {
//       try {
//             const allData = await items.find();
//             return res.status(200).json(allData);
//       } catch (err) {
//             console.log(err);
//       }
// });


// Apply category filter if provided
app.get("/filterItems", async (req, res) => {
      try {
            const { category, minPrice, maxPrice, dishName, sortBy = "count", order = "desc" } = req.query;
            let filter = {};

            if (category) {
                  filter.category = category;
            }

            if (dishName) {
                  filter.dishName = { $regex: dishName, $options: "i" }
            }

            if (minPrice && maxPrice) {
                  filter.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
            } else if (minPrice) {
                  filter.price = { $gte: parseInt(minPrice) };
            } else if (maxPrice) {
                  filter.price = { $lte: parseInt(maxPrice) };
            }

            let { page = 1, limit = 10 } = req.query;
            page = parseInt(page);
            limit = parseInt(limit);

            console.log("Applied filter:", filter);

            const filteredData = await items.find(filter)
                  .sort({ [sortBy]: order })
                  .skip((page - 1) * limit)
                  .limit(limit);

            return res.status(200).json(filteredData);
      } catch (err) {
            console.error("Error:", err);
            return res.status(500).json({ message: "Internal Server Error" });
      }
});


app.get("/customers/:mobile", async (req, res) => {
      try {
            const mobile = req.params.mobile;
            const user = await customers.findOne({ mobile });

            if (!user) {
                  return res.status(404).json({ error: "User not found" });
            }
            res.json(user);
      } catch (err) {
            console.log(err.message);
      }
});

app.get("/restaurant/:email", async (req, res) => {
      try {
            const email = req.params.email;
            const restaurant = await restaurants.findOne({ email });

            if (!restaurant) {
                  return res.status(404).json({ error: "User not found" });
            }
            res.json(restaurant);
      } catch (err) {
            console.log(err.message);
      }
});

app.get("/items/:email", async (req, res) => {
      try {
            const email = req.params.email;
            const user = await items.find({ email });

            if (!user) {
                  return res.status(404).json({ error: "items not found" });
            }
            res.json(user);
      } catch (err) {
            return res.status(400);
      }
});

app.get("/searchItems/:dishName", async (req, res) => {
      try {
            const dishName = req.params.dishName;

            const user = await items.find({
                  dishName: { $regex: dishName, $options: "i" }
            });

            if (!user || user.length === 0) {
                  return res.status(404).json({ error: "Items not found" });
            }

            res.json(user);
      } catch (err) {
            return res.status(500).json({ error: "Server error" });
      }
});


app.delete("/delItems/:id", async (req, res) => {
      try {
            await items.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Item removed successfully" });
      } catch (err) {
            res.status(400);
      }
});

app.delete("/delCartItems/:id", async (req, res) => {
      try {
            await cartItems.findByIdAndDelete(req.params.id);
            res.status(200).json({ message: "Item removed successfully" });
      } catch (err) {
            res.status(400);
      }
});

app.delete("/cartEmpty/:mobile", async (req, res) => {
      var mobile = req.params.mobile;
      try {
            await cartItems.deleteMany({ mobile });
            res.status(200).json({ message: "Items removed successfully.... cart empty" });
      } catch (err) {
            res.status(400);
      }
});

app.put("/updateItem/:id", async (req, res) => {
      const itemId = req.params.id;
      const updateData = req.body;

      try {
            const updatedRestaurant = await items.updateOne(
                  { _id: itemId },
                  { $set: updateData }
            );

            if (!updatedRestaurant) {
                  return res.status(404).json({ error: "Item not found" });
            }
            res.status(200).json(updatedRestaurant);
      } catch (error) {
            console.error("Error:", error);
            res.status(500).json({ error: "Server error" });
      }
});

app.get("/", (req, res) => {
      res.send("Hello from Vercel!");
});

app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get('/favicon.png', (req, res) => res.status(204).end());

module.exports = app;
