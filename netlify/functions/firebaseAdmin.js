const admin = require("firebase-admin");

// ✅ 환경변수에서 값 불러오기
const privateKey = process.env.FB_PRIVATE_KEY?.replace(/\\n/g, "\n");
const clientEmail = process.env.FB_CLIENT_EMAIL;
const projectId = process.env.FB_PROJECT_ID;

// ✅ 디버깅 로그 (1회 확인용, 배포 후 제거해도 됨)
console.log("📦 Firebase ENV:", {
  hasKey: !!privateKey,
  clientEmail,
  projectId,
});

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

// ✅ Firestore 정상 초기화 후 export
const db = admin.firestore();
module.exports = { admin, db };
