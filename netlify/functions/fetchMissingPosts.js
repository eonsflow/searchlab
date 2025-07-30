// netlify/functions/fetchMissingPosts.js
const axios = require("axios");
const Parser = require("rss-parser");
const { db } = require("./firebaseAdmin");

const parser = new Parser();

exports.handler = async (event) => {
  try {
    const { blogUrl, userId = null } = JSON.parse(event.body || "{}");

    if (!blogUrl) {
      return { statusCode: 400, body: JSON.stringify({ error: "블로그 주소가 필요합니다." }) };
    }

    let cleanUrl = blogUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = "https://" + cleanUrl;
    cleanUrl = cleanUrl.replace(/\/$/, "");

    const urlVariants = [
      `${cleanUrl}/sitemap.xml`,
      `${cleanUrl}/rss`,
      `${cleanUrl}/rss.xml`,
      `${cleanUrl}/feeds/posts/default?alt=rss`,
      `${cleanUrl}/atom.xml`,
    ];

    let foundFeed = null;
    let feedText = "";
    let postUrls = [];

    for (const url of urlVariants) {
      try {
        const res = await axios.get(url, { timeout: 8000 });
        if (res.status === 200 && res.data) {
          feedText = res.data;
          foundFeed = url;

          if (url.includes("sitemap")) {
            const locRegex = /<loc>(.*?)<\/loc>/g;
            let match;
            while ((match = locRegex.exec(feedText)) !== null) {
              if (match[1].startsWith("http")) postUrls.push(match[1]);
            }
          } else {
            const parsed = await parser.parseString(feedText);
            postUrls = parsed.items.map(item => item.link).filter(Boolean);
          }

          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!foundFeed || postUrls.length === 0) {
      console.log("❌ 피드 검색 실패:", blogUrl);
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: "NOT_FOUND",
          detail: {
            reason: "피드 없음 또는 게시글 없음",
            blogUrl,
            foundFeed,
            postUrls: [],
          }
        }),
      };
    }

    postUrls = [...new Set(postUrls)];
    const isValidUrl = (u) => typeof u === "string" && u.startsWith("http") && !u.includes("sitemap");

    const checkIfIndexed = async (url, engine) => {
      const searchUrl = {
        google: `https://www.google.com/search?q=site:${url}`,
        bing: `https://www.bing.com/search?q=site:${url}`,
        naver: `https://search.naver.com/search.naver?query=site:${url}`,
      }[engine];

      try {
        const res = await axios.get(searchUrl, {
          headers: { "User-Agent": "Mozilla/5.0" },
          timeout: 8000,
        });

        return !res.data.includes("No results found") &&
               !res.data.includes("검색결과가 없습니다") &&
               !res.data.includes("일치하는 결과가 없습니다");
      } catch (err) {
        return false;
      }
    };

    let loggedUrls = {};
    let pingCount = 0;
    const pingLimit = 15;

    if (userId) {
      const date = new Date().toISOString().split("T")[0];
      const logDoc = await db.collection("users").doc(userId).collection("logs").doc(date).get();
      if (logDoc.exists) {
        loggedUrls = logDoc.data();
        pingCount = Object.keys(loggedUrls).length;
      }
    }

    const success = [];
    const failed = [];

    for (const postUrl of postUrls) {
      if (!isValidUrl(postUrl)) continue;
      if (loggedUrls[postUrl]) continue;
      if (pingCount >= pingLimit) break;

      const isGoogle = await checkIfIndexed(postUrl, "google");
      const isBing = await checkIfIndexed(postUrl, "bing");
      const isNaver = await checkIfIndexed(postUrl, "naver");

      const allIndexed = isGoogle && isBing && isNaver;

      if (allIndexed) {
        success.push(postUrl);
      } else {
        failed.push({
          url: postUrl,
          engines: {
            google: isGoogle,
            bing: isBing,
            naver: isNaver,
          }
        });
      }

      pingCount++;
    }

    if (success.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          error: "NOT_FOUND",
          detail: {
            reason: "수집 성공 0건",
            feed: foundFeed,
            total: postUrls.length,
            failed: failed.length,
            failedList: failed
          }
        }),
      };
    }

    console.log("[🧪 fetchMissingPosts 결과]", {
      blogUrl,
      totalPosts: postUrls.length,
      success: success.length,
      failed: failed.length,
      failedPreview: failed.slice(0, 3),
      userId
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        user: userId || "guest",
        feedUrl: foundFeed,
        total: postUrls.length,
        registered: success.length,
        failed: failed.length,
        successList: success,
        failedList: failed,
        summary: `총 ${postUrls.length}건 중 ${success.length}건 등록됨`
      })
    };

  } catch (err) {
    console.error("❌ 처리 중 오류:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "서버 오류",
        detail: {
          reason: "예외 발생",
          message: err.message || "No message",
          stack: err.stack || "No stack trace"
        }
      }),
    };
  }
};
