const mongoose = require('mongoose');

//schema for payment
const PaymentSchema = new mongoose.Schema({
    amount: Number,
    currency: String,
    paymentIntentId: String,
    createdAT: { type: Date, default: Date.now}
});

// Model for payment 
module.exports = mongoose.model('Payment', PaymentSchema);
