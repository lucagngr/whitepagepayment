require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyPARser = require('body-parser');
const cors = require('cors');
const path = require("path");
const mongoose = require('mongoose');
const payment = require('./models/payment');
const MONGODB_URI = "mongodb://localhost:27017/stripe_payments";

const app = express();
app.use(cors());
app.use(bodyPARser.json());

app.use(express.static(path.join(__dirname, "public")));  // Sert les fichiers statiques depuis le dossier 'public'

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));  // Charge index.html
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

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ['card']
        });

        // save payment in MongoDB

        const payment = new Payment({
            amount,
            currency,
            paymentIntentID: paymentIntent.id,
            status: "pending"
        });
        await payment.save();

        res.json({ clientSecret: paymentIntent.client_secret});
    }catch (error) {
        res.status(500).json({ error: error.message});
    } finally {
        res.end();
    }
});

app.post('/confirm-payment', async (req, res)=> {
    try  {
        const { paymentIntentId} = req.body;
        const payment = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (paymentIntent.status === "succeeded") {
            await Payment.findOneAndUpdate(
                { paymentIntentId },
                { status: "succeeded" }
            );
        }

        res.json({ status: paymentIntent.status });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
