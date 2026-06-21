console.log("payment.js loaded");

const bookingForm = document.getElementById("bookingForm");

bookingForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const checkIn = bookingForm.checkIn.value;
    const checkOut = bookingForm.checkOut.value;
    const guests = bookingForm.guests.value;

    try {
        const response = await fetch(`/listings/${window.listingId}/book`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                checkIn,
                checkOut,
                guests
            })
        });
        const data = await response.json();
        console.log(data);

        if (!data.success) {
            alert(data.message);
            return;
        }
        const options = {
                key: window.razorpayKey,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "WanderLust Homes",
                description: "Property Booking Payment",
                order_id: data.order.id,

                handler: async function(response) {
                    console.log("Payment Success:", response);

                    const verifyResponse = await fetch("/listings/verify-payment", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            payment: response,
                            bookingData: data.bookingData,
                            pricing: data.pricing
                        })
                    });

                    const result = await verifyResponse.json();
                    if (result.success) {
                        alert("Booking Confirmed!");
                        window.location.href = "/my-trips";
                    }
                },
                modal: {
                        ondismiss: function () {
                            alert("Payment Cancelled ❌");
                        }
                },
                theme: {
                    color: "#fe424d"
                }
            };
            const rzp = new Razorpay(options);
            rzp.on("payment.failed", function (response) {
                console.log(response);

                alert(
                    "Payment Failed ❌\n\n" +
                    response.error.description
                );
            });
            rzp.open();

    } catch (err) {
        console.log("ERROR:",err);
        alert(err.message);
    }
});