document.addEventListener("DOMContentLoaded", async () => {
    const stripe = Stripe("pk_test_51Qp8MO03p3Fp9HUOej1DHC7oLDMzryIUoH6zOqzmrOOYQLgcKxxPQbq4DQnJZm2IJohiaJZeMxKoR23V4ASsLEYJ00qWjiLWaE");
    const elements = stripe.elements();

    // Crée un élément de carte
    const cardElement = elements.create("card");
    cardElement.mount("#card-element");

    // Crée le PaymentIntent
    const response = await fetch("http://localhost:3000/create-payment-intent", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ amount: 1000, currency: "eur" }) 
    });
    const data = await response.json();
    const clientSecret = data.clientSecret;

    const form = document.getElementById("payment-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Confirme le paiement avec Stripe
        const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement }
        });

        const message = document.getElementById("payment-message");

        if (error) {
            message.textContent = "Erreur : " + error.message;
        } else if (paymentIntent.status === "succeeded") {
            // Confirme le paiement sur le backend
            await fetch('http://localhost:3000/confirm-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ paymentIntentId: paymentIntent.id })
            });
            message.textContent = "Paiement réussi et enregistré";
        }
    });
});
