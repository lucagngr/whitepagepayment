require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require("path");
const mongoose = require('mongoose');
const Payment = require('./models/payment');
const MONGODB_URI = "mongodb://localhost:27017/stripe_payments";
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublicKey = process.env.STRIPE_PUBLIC_KEY;


const app = express();
app.use(cors());
app.use(bodyParser.json()); 

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connexion à MongoDB réussie"))
  .catch((err) => console.error("Erreur de connexion MongoDB :", err));

app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, currency } = req.body;

        // Created PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ['card']
        });

        // Save PaymentIntent in MongoDB
        const payment = new Payment({
            amount,
            currency,
            paymentIntentID: paymentIntent.id,
            status: "pending"
        });
        await payment.save();

        res.json({ clientSecret: paymentIntent.client_secret }); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/confirm-payment', async (req, res) => {
    try {
        const { paymentIntentId } = req.body;

        // Recept payment status from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // update payment status in MongoDB
        if (paymentIntent.status === "succeeded") {
            await Payment.findOneAndUpdate(
                { paymentIntentID: paymentIntentId },
                { status: "succeeded" }
            );
        }

        res.json({ status: paymentIntent.status });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
