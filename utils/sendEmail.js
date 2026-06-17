const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port:2525,
    secure:false,
    auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_PASS,
    },
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