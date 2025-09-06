import express from "express";

const app = express();

// مسار تجريبي
app.get("/", (req, res) => {
  res.send("✅ السيرفر شغال تمام على Replit!");
});

// خليه ياخذ المنفذ من Replit أو 5000 إذا محلي
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("🚀 Server is running on port " + PORT);
});
