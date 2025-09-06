import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ✅ للتحقق من الويبهوك
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ استقبال الرسائل
app.post("/webhook", async (req, res) => {
  try {
    for (const entry of req.body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        if (event.message?.text) {
          const userText = event.message.text;

          // استدعاء OpenAI
          const ai = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: userText }]
          });

          const reply =
            ai.choices[0]?.message?.content ||
            "لم أفهم، حاول إعادة الصياغة.";

          await sendTextMessage(senderId, reply);
        }
      }
    }
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.sendStatus(500);
  }
});

// ✅ إرسال رسالة إلى Messenger
async function sendTextMessage(psid, text) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        recipient: { id: psid },
        message: { text }
      }
    );
  } catch (err) {
    console.error("❌ Error sending message:", err.response?.data || err.message);
  }
}

app.listen(PORT, () => console.log("🚀 Bot running on port", PORT));
