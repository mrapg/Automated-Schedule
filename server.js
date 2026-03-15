import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./serviceAccount.json", "utf8")
);

const app = express();
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.post("/send-notification", async (req, res) => {

  const { title, body, type, eventDate, eventId } = req.body;

  try {

    const snapshot = await db
      .collection("artifacts/schedule-debeb/public/data/push_tokens")
      .get();

    const tokens = snapshot.docs.map(d => d.data().token);

    const message = {
      notification: { title, body },
      data: {
        type: type || "general",
        eventDate: eventDate || "",
        eventId: eventId || ""
      },
      tokens: tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    res.json({
      success: true,
      count: response.successCount
    });

  } catch (e) {
    res.json({
      success: false,
      error: e.message
    });
  }

});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});