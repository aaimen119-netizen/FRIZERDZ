import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();
const app = express();
app.use(express.json());

// المنفذ (مهم جدًا في Replit)
const PORT = process.env.PORT || 3000;

// التوكنات من ملف .env (Secrets في Replit)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// التحقق من الويبهوك
app.get("/webhook", (req, res) => {
  console.log("🔎 Webhook verification request:", req.query);

  if (req.query["hub.verify_token"] === VERIFY_TOKEN) {
    return res.send(req.query["hub.challenge"]);
  }
  res.sendStatus(403);
});

// استقبال الرسائل
app.post("/webhook", async (req, res) => {
  console.log("📩 Incoming message:", JSON.stringify(req.body, null, 2));

  for (const entry of req.body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender.id;
      if (event.message?.text) {
        const userText = event.message.text;

        try {
          // رد بالذكاء الاصطناعي
          const ai = await openai.responses.create({
            model: "gpt-4o-mini",
            input: [{ role: "user", content: userText }]
          });

          const reply = ai.output_text || "لم أفهم، حاول إعادة الصياغة.";
          await sendTextMessage(senderId, reply);
        } catch (err) {
          console.error("❌ Error from OpenAI:", err.message);
          await sendTextMessage(senderId, "حصل خطأ في المعالجة، حاول مرة أخرى.");
        }
      }
    }
  }
  res.sendStatus(200);
});

// دالة إرسال رسالة إلى Messenger
async function sendTextMessage(psid, text) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    { recipient: { id: psid }, message: { text } }
  );
}

// تشغيل السيرفر
app.listen(PORT, () => console.log(`🚀 Bot running on port ${PORT}`));
