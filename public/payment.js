document.addEventListener("DOMContentLoaded", async () => {
    const stripe = Stripe("pk_test_51Qp8MO03p3Fp9HUOej1DHC7oLDMzryIUoH6zOqzmrOOYQLgcKxxPQbq4DQnJZm2IJohiaJZeMxKoR23V4ASsLEYJ00qWjiLWaE");
    const elements = stripe.elements();

    // Create card element
    const cardElement = elements.create("card");
    cardElement.mount("#card-element");

    // Get form and message container
    const form = document.getElementById("payment-form");
    const message = document.getElementById("payment-message");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Retrieve input values
        const firstName = document.getElementById("first-name").value.trim();
        const lastName = document.getElementById("last-name").value.trim();
        const email = document.getElementById("email").value.trim();
        const fullName = `${firstName} ${lastName}`;

        // Validate input fields
        if (!firstName || !lastName || !email) {
            message.textContent = "Please fill in all fields.";
            return;
        }

        try {
            // Create PaymentIntent on the server
            const response = await fetch("http://localhost:3000/create-payment-intent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: 1000, currency: "eur", name: fullName, email })
            });

            if (!response.ok) throw new Error("Failed to create payment.");
            const data = await response.json();
            const clientSecret = data.clientSecret;

            // Confirm payment with Stripe
            const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: { name: fullName, email }
                }
            });

            if (error) {
                message.textContent = "Error: " + error.message;
            } else if (paymentIntent.status === "succeeded") {
                // Confirm the payment on the backend
                await fetch("http://localhost:3000/confirm-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ paymentIntentId: paymentIntent.id, name: fullName, email })
                });

                message.textContent = "Payment successful and recorded.";
            }
        } catch (error) {
            console.error(error);
            message.textContent = "An error occurred. Please try again.";
        }
    });
});
