const express = require("express");
const bodyParser = require("body-parser");
const request = require("request");

const app = express();
app.use(bodyParser.json());

// المتغيرات من Secrets في Replit
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

// ✅ تحديد البورت الصحيح (Replit يعطيه أو 5000 محليًا)
const PORT = process.env.PORT || 5000;

// Route للتأكد من Facebook Webhook
app.get("/webhook", (req, res) => {
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Route لاستقبال الرسائل من Facebook
app.post("/webhook", (req, res) => {
  let body = req.body;

  if (body.object === "page") {
    body.entry.forEach(function(entry) {
      let webhookEvent = entry.messaging[0];
      let senderId = webhookEvent.sender.id;

      if (webhookEvent.message && webhookEvent.message.text) {
        let receivedMessage = webhookEvent.message.text;

        // هنا تقدر تربط بالـ OpenAI API أو تجاوب عادي
        sendMessage(senderId, `انت كتبت: ${receivedMessage}`);
      }
    });

    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

// دالة لإرسال رسالة للـ Messenger
function sendMessage(senderId, response) {
  let requestBody = {
    recipient: { id: senderId },
    message: { text: response }
  };

  request(
    {
      uri: "https://graph.facebook.com/v12.0/me/messages",
      qs: { access_token: PAGE_ACCESS_TOKEN },
      method: "POST",
      json: requestBody
    },
    (err, res, body) => {
      if (!err) {
        console.log("message sent!");
      } else {
        console.error("Unable to send message:" + err);
      }
    }
  );
}

// تشغيل السيرفر
app.listen(PORT, () => {
  console.log(`Bot running on port ${PORT}`);
});
