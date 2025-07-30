// netlify/functions/retryFailedPosts.js
const axios = require("axios");
const { db, admin } = require("./firebaseAdmin");

exports.handler = async (event) => {
  try {
    // ✅ 디버깅용 로그
    console.log("📩 Body received:", event.body);

    const { userId, date } = JSON.parse(event.body || "{}");

    if (!userId || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "userId와 date가 필요합니다.",
        }),
      };
    }

    const logRef = db.collection("users").doc(userId).collection("logs").doc(date);
    const logDoc = await logRef.get();

    if (!logDoc.exists) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "기록 없음",
          retried: 0,
          updated: [],
        }),
      };
    }

    const data = logDoc.data();
    const failedUrls = Object.entries(data).filter(
      ([_, value]) => value.result !== "success"
    );

    const results = [];

    for (const [url] of failedUrls) {
      const pingGoogle = await axios
        .get(`https://www.google.com/ping?sitemap=${url}`)
        .then((r) => r.status === 200)
        .catch((err) => {
          console.error(`❌ Google ping 실패 (${url}):`, err.message);
          return false;
        });

      const pingBing = await axios
        .get(`https://www.bing.com/ping?sitemap=${url}`)
        .then((r) => r.status === 200)
        .catch((err) => {
          console.error(`❌ Bing ping 실패 (${url}):`, err.message);
          return false;
        });

      const result = {
        url,
        result: pingGoogle || pingBing ? "success" : "fail",
        engines: { google: pingGoogle, bing: pingBing },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };

      await logRef.set({ [url]: result }, { merge: true });
      results.push(result);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        retried: results.length,
        updated: results,
      }),
    };
  } catch (err) {
    console.error("❌ 서버 오류:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "서버 오류",
        detail: err.message,
      }),
    };
  }
};
