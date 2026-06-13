const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

require("dotenv").config();
const mongoose = require("mongoose");

console.log(process.env.ATLASDB_URL);

mongoose.connect(process.env.ATLASDB_URL)
.then(() => {
    console.log("CONNECTED");
    process.exit(0);
})
.catch(err => {
    console.error("ERROR:", err);
    process.exit(1);
});