// netlify/functions/pingPosts.js

const axios = require("axios");
const { db, admin } = require("./firebaseAdmin");

exports.handler = async (event) => {
  try {
    const { userId = "guest", urls = [] } = JSON.parse(event.body || "{}");

    if (!urls.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "등록 요청할 URL이 없습니다.",
        }),
      };
    }

    const successList = [];
    const failedList = [];

    for (const url of urls) {
      const pingGoogle = await axios
        .get(`https://www.google.com/ping?sitemap=${url}`)
        .then((res) => res.status === 200)
        .catch(() => false);

      const pingBing = await axios
        .get(`https://www.bing.com/ping?sitemap=${url}`)
        .then((res) => res.status === 200)
        .catch(() => false);

      if (pingGoogle || pingBing) {
        successList.push(url);
      } else {
        failedList.push(url);
      }
    }

    // ✅ Firestore 통계 로그 저장
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    const logRef = db
      .collection("users")
      .doc(userId)
      .collection("logs")
      .doc(dateStr);

    const logData = {};
    for (const url of successList) {
      logData[url] = {
        result: "success",
        engines: {
          google: true,
          bing: true,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
    }
    for (const url of failedList) {
      logData[url] = {
        result: "fail",
        engines: {
          google: false,
          bing: false,
        },
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      };
    }

    await logRef.set(logData, { merge: true });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "색인 등록 요청 완료",
        requested: urls.length,
        registered: successList.length,
        failed: failedList.length,
        successList,
        failedList,
      }),
    };
  } catch (err) {
    console.error("[pingPosts.js] Error:", err);
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
