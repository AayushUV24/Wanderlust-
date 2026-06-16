const express = require("express");
const router = express.Router();

const chatController = require("../controllers/chat");

router.get("/", chatController.renderChatPage);
router.post("/message", chatController.sendMessage);

module.exports = router;