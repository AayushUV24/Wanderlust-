const nodemailer = require("nodemailer");

console.log("BREVO_USER =", process.env.BREVO_USER);
console.log("BREVO_PASS exists =", !!process.env.BREVO_PASS);
console.log("SENDER_EMAIL =", process.env.SENDER_EMAIL);

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port:587,
    secure:false,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
    },
});
transporter.verify(function(error, success) {
    if (error) {
        console.log("SMTP VERIFY ERROR:", error);
    } else {
        console.log("SMTP SERVER READY");
    }
});


const sendOTP = async (email, otp) => {
    await transporter.sendMail({
        from: `Wanderlust <${process.env.SENDER_EMAIL}>`,
        to: email,
        subject: "Wanderlust Email Verification",
        html: `
            <h2>Your OTP is:</h2>
            <h1>${otp}</h1>
            <p>Valid for 5 minutes.</p>
        `,
    });
};

module.exports = sendOTP;