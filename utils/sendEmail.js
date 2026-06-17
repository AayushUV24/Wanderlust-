const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port:587,
    secure:false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
});
transporter.verify((error, success) => {
    if(error){
        console.log("SMTP ERROR:", error);
    }else{
        console.log("SMTP Server Ready");
    }
});

const sendOTP = async (email, otp) => {
    await transporter.sendMail({
        from: process.env.EMAIL_USER,
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