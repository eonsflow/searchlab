import React, { useEffect, useState } from "react";
import AuthSection from "./components/AuthSection";
import ResultSection from "./components/ResultSection";
import UserLogTable from "./components/UserLogTable";
import netlifyIdentity from "netlify-identity-widget";

function App() {
  const [user, setUser] = useState(null);
  const [blogUrl, setBlogUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().split("T")[0]
  );
  const [logStats, setLogStats] = useState(null);

  useEffect(() => {
    netlifyIdentity.init();
    netlifyIdentity.on("login", (user) => {
      setUser(user);
      netlifyIdentity.close();
    });
    netlifyIdentity.on("logout", () => setUser(null));
    const current = netlifyIdentity.currentUser();
    if (current) setUser(current);
  }, []);

  const getToken = async () => {
    const user = netlifyIdentity.currentUser();
    if (!user) throw new Error("로그인 필요");
    return user.token.access_token;
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch("/.netlify/functions/getUserStats", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId: user.uid, date: selectedDate }),
        });
        const data = await res.json();
        setLogStats(data);
      } catch (err) {
        setError("통계 불러오기 실패");
      }
    })();
  }, [user, selectedDate]);

  const handleCheck = async () => {
    if (!user) return setError("로그인 필요");
    setLoading(true);
    setError("");
    setResultData(null);
    try {
      const token = await getToken();
      const res = await fetch("/.netlify/functions/fetchMissingPosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          blogUrl: blogUrl.replace(/^https?:\/\//, "").replace(/\/$/, ""),
          userId: user.uid,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "처리 실패");
      setResultData(data);
    } catch (err) {
      setError(err.message || "오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const handleRetrySingleUrl = async (url) => {
    if (!user) return;
    try {
      const token = await getToken();
      await fetch("/.netlify/functions/retryFailedPosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid, date: selectedDate }),
      });
      const refreshed = await fetch("/.netlify/functions/getUserStats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid, date: selectedDate }),
      });
      const updated = await refreshed.json();
      setLogStats(updated);
      alert("🔁 재시도 완료");
    } catch (err) {
      alert("❌ 재시도 실패: " + err.message);
    }
  };

  const handleRetryAllFailed = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const res = await fetch("/.netlify/functions/retryFailedPosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid, date: selectedDate }),
      });
      const data = await res.json();
      const refreshed = await fetch("/.netlify/functions/getUserStats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid, date: selectedDate }),
      });
      const updated = await refreshed.json();
      setLogStats(updated);
      alert(`🔁 전체 ${data.retried}건 재시도 완료`);
    } catch (err) {
      alert("❌ 전체 재시도 실패: " + err.message);
    }
  };

  const handleRequestPing = async () => {
    if (!user || !resultData?.failedList?.length) return;
    setLoading(true);
    setError("");
    try {
      const token = await getToken();
      const urls = resultData.failedList.map((item) => item.url);
      const res = await fetch("/.netlify/functions/pingPosts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ urls, userId: user.uid }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "색인 요청 실패");

      setResultData({
        ...resultData,
        registered: resultData.registered + data.registered,
        failed: data.failed,
        successList: [
          ...resultData.successList,
          ...data.successList.map((url) => ({
            url,
            google: true,
            bing: true,
            naver: true,
          })),
        ],
        failedList: data.failedList,
      });

      alert(`🚀 색인 요청 완료: ${data.registered}건 성공`);
    } catch (err) {
      setError(err.message || "Ping 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-100 p-6">
      <h1 className="text-2xl font-bold mb-4 text-blue-900">🔐 검색 누락 글 자동 등록</h1>
      <AuthSection onUserChange={setUser} />
      <div className="text-right mb-4">
        {user ? (
          <button onClick={() => netlifyIdentity.logout()} className="text-sm text-red-600 underline hover:text-red-800">
            로그아웃
          </button>
        ) : (
          <button onClick={() => netlifyIdentity.open()} className="text-sm text-blue-800 underline hover:text-blue-600">
            로그인 / 회원가입
          </button>
        )}
      </div>

      {user && (
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <input
            type="text"
            className="border border-gray-300 px-3 py-2 w-full rounded mb-3"
            placeholder="https://eonslab.blogspot.com"
            value={blogUrl}
            onChange={(e) => setBlogUrl(e.target.value)}
          />
          <button
            onClick={handleCheck}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
          >
            {loading ? "확인 중..." : "확인하기"}
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-600 border border-red-300 p-3 rounded mb-4">
          ❌ {error}
        </div>
      )}

      {resultData && (
        <ResultSection
          total={resultData.total}
          registered={resultData.registered}
          failed={resultData.failed}
          successList={
            resultData.successList.map((item) =>
              typeof item === "string"
                ? { url: item, google: true, bing: true, naver: true }
                : item
            )
          }
          failedList={
            resultData.failedList.map((item) =>
              typeof item === "string"
                ? { url: item, google: false, bing: false, naver: false }
                : item
            )
          }
          onRequestPing={handleRequestPing}
        />
      )}

      {user && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            등록 내역 조회 날짜
          </label>
          <input
            type="date"
            className="border px-3 py-2 rounded w-full"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      )}

      {user && logStats && (
        <>
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 mb-4 rounded border border-yellow-300">
            📊 총 {logStats.total}건 중{" "}
            <span className="font-bold">{logStats.registered}</span>건 성공 /{" "}
            <span className="text-red-500 font-bold">{logStats.failed}</span>건 실패 (
            {Math.round((logStats.registered / logStats.total) * 100 || 0)}%)
          </div>

          {logStats.failed > 0 && (
            <div className="mb-6">
              <button
                onClick={handleRetryAllFailed}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-4 py-2 rounded shadow"
              >
                🔁 실패 전체 재시도 ({logStats.failed}건)
              </button>
            </div>
          )}

          <UserLogTable
            logs={[...logStats.successList, ...logStats.failedList]}
            date={selectedDate}
            onRetry={handleRetrySingleUrl}
          />
        </>
      )}
    </div>
  );
}

export default App;
