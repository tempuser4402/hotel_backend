const mongoose = require("mongoose"); // Erase if already required

// Declare the Schema of the Mongo model
var testSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    index: true,
  },
});

//Export the model
module.exports = mongoose.model("Test", testSchema);
