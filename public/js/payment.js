// document.addEventListener("DOMContentLoaded", () => {
console.log(document.readyState);
        console.log("payment.js loaded");

        const bookingForm = document.getElementById("bookingForm");
        let bookingResponseData = null;
        let currentPricing = null;
        let appliedCoupon = null;
        let finalAmount = null;

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
                bookingResponseData = data;
                currentPricing = data.pricing;
                finalAmount = data.pricing.totalPrice;

                document.getElementById("modalBasePrice").innerText =
                    data.pricing.basePrice.toLocaleString("en-IN");

                document.getElementById("modalGst").innerText =
                    data.pricing.gst.toLocaleString("en-IN");

                document.getElementById("modalServiceFee").innerText =
                    data.pricing.serviceFee.toLocaleString("en-IN");

                document.getElementById("modalTotal").innerText =
                    data.pricing.totalPrice.toLocaleString("en-IN");

                const paymentModal = new bootstrap.Modal(
                    document.getElementById("paymentModal")
                );

                paymentModal.show();

            } catch (err) {
                console.log("ERROR:", err);
                alert(err.message);
            }
        });

        const applyCouponBtn = document.getElementById("applyCouponBtn");

        applyCouponBtn.addEventListener("click", async () => {
            const couponCode = document.getElementById("couponCode").value;

            if (!couponCode) {
                alert("Please enter coupon code");
                return;
            }

            try {
                const response = await fetch("/listings/apply-coupon", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ couponCode })
                });

                const data = await response.json();
                console.log(data);

                if (!data.success) {
                    alert(data.message);
                    return;
                }

                appliedCoupon = data.coupon;

            let discount = 0;

            if (data.coupon.discountType === "flat") {
                discount = data.coupon.discountValue;
            } else if (data.coupon.discountType === "percentage") {
                discount = Math.round(
                    currentPricing.basePrice * data.coupon.discountValue / 100
                );
            }

            const newTotal = Math.max(
                currentPricing.totalPrice - discount,
                0
            );
            finalAmount = newTotal;
            console.log("Updated Final Amount:", finalAmount);

            document.getElementById("modalTotal").innerText =
                currentPricing.totalPrice.toLocaleString("en-IN");

            const couponMessage = document.getElementById("couponMessage");

            document.getElementById("discountRow").style.display = "block";
            document.getElementById("finalTotalRow").style.display = "block";

            document.getElementById("discountAmount").innerText =
                discount.toLocaleString("en-IN");

            document.getElementById("finalTotal").innerText =
                newTotal.toLocaleString("en-IN");

            couponMessage.style.color = "green";
            } catch (err) {
                console.log(err);
            }
        });

        const payNowBtn = document.getElementById("payNowBtn");

        payNowBtn.addEventListener("click", async () => {
            const orderResponse = await fetch("/listings/create-order", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount: finalAmount
                })
            });

            const orderData = await orderResponse.json();
            console.log(orderData);
            const options = {
                key: window.razorpayKey,
                amount: finalAmount * 100,
                currency: "INR",
                name: "WanderLust Homes",
                description: "Property Booking Payment",
                order_id: orderData.order.id,

                handler: async function(response) {
                    console.log("Payment Success:", response);

                    const verifyResponse = await fetch("/listings/verify-payment", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            payment: response,
                            bookingData: bookingResponseData.bookingData,
                            pricing: {
                                ...currentPricing,
                                discount: currentPricing.totalPrice - finalAmount,
                                couponCode: appliedCoupon ? appliedCoupon.code : null,
                                totalPrice: finalAmount
                            }
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

            rzp.on("payment.failed", function(response) {
                console.log(response);

                alert(
                    "Payment Failed ❌\n\n" +
                    response.error.description
                );
            });

            rzp.open();
        });
// });
