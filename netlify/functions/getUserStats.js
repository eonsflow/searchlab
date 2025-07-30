const { db } = require("./firebaseAdmin");

exports.handler = async (event) => {
  try {
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

    const docRef = db.collection("users").doc(userId).collection("logs").doc(date);
    const doc = await docRef.get();

    if (!doc.exists) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          total: 0,
          registered: 0,
          failed: 0,
          successList: [],
          failedList: [],
        }),
      };
    }

    const data = doc.data();
    const successList = [];
    const failedList = [];

    for (const [url, value] of Object.entries(data)) {
      if (value.result === "success") {
        successList.push({ url, ...value });
      } else {
        failedList.push({ url, ...value });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        total: successList.length + failedList.length,
        registered: successList.length,
        failed: failedList.length,
        successList,
        failedList,
      }),
    };
  } catch (err) {
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
