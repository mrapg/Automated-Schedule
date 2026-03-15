const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNotification = functions.https.onRequest(async (req, res) => {
  const { title, body, type, eventDate, eventId } = req.body;

  try {

    const snapshot = await admin
      .firestore()
      .collection("artifacts/schedule-debeb/public/data/push_tokens")
      .get();

    const tokens = snapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      return res.json({
        success: false,
        message: "No tokens found"
      });
    }

    const message = {
      notification: {
        title,
        body
      },
      data: {
        type: type || "general",
        eventDate: eventDate || "",
        eventId: eventId || ""
      },
      tokens
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    res.json({
      success: true,
      count: response.successCount
    });

  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});