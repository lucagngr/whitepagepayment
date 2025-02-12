
if (error) {
    message.textContent = "Erreur : " + error.message;
} else if (paymentIntent.status === "succeeded") {
    // Confirm the payment on the backend
    await fetch('http://localhost:3000/confirm-payment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ paymentIntentId: paymentIntent.id })
    });
    message.textContent = "Paiement réussi et enregistré";
}



document.addEventListener("DOMContentLoaded", async () => {
    const stripe = Stripe("pk_test_51Qp8MO03p3Fp9HUOej1DHC7oLDMzryIUoH6zOqzmrOOYQLgcKxxPQbq4DQnJZm2IJohiaJZeMxKoR23V4ASsLEYJ00qWjiLWaE");
    const elements = stripe.elements();

    // Création des éléments Stripe
    const cardElement = elements.create("card");
    cardElement.mount("#card-element");

    const paymentElement = elements.create("payment", {
        fields: {
            billingDetails: {
                name: "never",
                email: "never",
            },
        },
    });
    paymentElement.mount("#payment-element");

    // Création du PaymentIntent
    const response = await fetch("http://localhost:3000/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 1000, currency: "eur" }),
    });

    const data = await response.json();
    const clientSecret = data.clientSecret;

    // Gestion du formulaire de paiement
    const form = document.getElementById("payment-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const paymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
            let paymentResult;

            if (paymentMethod === "card") {
                paymentResult = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: { card: cardElement },
                });
            } else {
                paymentResult = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                        return_url: "http://localhost:3000/confirm-payment",
                        payment_method_data: {
                            billing_details: {
                                name: "Luca Gogngora",
                                email: "Lglucagngr@gmail.com",
                            },
                        },
                    },
                });
            }

            const message = document.getElementById("payment-message");

            if (paymentResult.error) {
                message.textContent = "Erreur : " + paymentResult.error.message;
                return;
            }

            if (paymentResult.paymentIntent?.status === "succeeded") {
                await fetch("http://localhost:3000/confirm-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentIntentId: paymentResult.paymentIntent.id }),
                });

                message.textContent = "Paiement réussi et enregistré";
            }
        } catch (error) {
            console.error("Erreur de paiement :", error);
        }
    });
});


