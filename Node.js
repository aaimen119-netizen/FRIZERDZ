import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());

// 📍 البورت + التوكينات
const PORT = process.env.PORT || 5000;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = "080808"; // لازم يكون نفسو في فيسبوك

// 📍 إعداد OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ WEBHOOK_VERIFIED");
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
});

// ✅ استقبال الرسائل من ماسنجر
app.post("/webhook", async (req, res) => {
  try {
    for (const entry of req.body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender.id;
        if (event.message?.text) {
          const userText = event.message.text;

          // 🔹 رد من الذكاء الاصطناعي
          const ai = await openai.responses.create({
            model: "gpt-4o-mini",
            input: [{ role: "user", content: userText }],
          });

          const reply = ai.output_text || "لم أفهم، حاول إعادة الصياغة.";
          await sendTextMessage(senderId, reply);
        }
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error:", err.message);
    res.sendStatus(500);
  }
});

// ✅ دالة إرسال الرسائل
async function sendTextMessage(psid, text) {
  await axios.post(
    `https://graph.facebook.com/v19.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    { recipient: { id: psid }, message: { text } }
  );
}

// ✅ مسار اختبار
app.get("/test", (req, res) => {
  res.send("✅ البوت شغال على البورت 5000");
});

// ✅ تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`✅ السيرفر شغال صح على البورت ${PORT}`);
});
