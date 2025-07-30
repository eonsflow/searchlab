import React from "react";

const ResultSection = ({ total, registered, failed, successList, failedList, onRequestPing }) => {
  return (
    <div className="mt-8 space-y-6">
      {/* 📊 결과 요약 */}
      <div className={`p-4 rounded-xl text-white ${failed > 0 ? "bg-yellow-500" : "bg-green-600"}`}>
        <h2 className="text-lg font-bold">
          📊 총 {total}건 중 {registered}건 등록 성공
        </h2>
        {failed > 0 && <p>⚠️ {failed}건은 등록 실패했습니다.</p>}
      </div>

      {/* 🚀 색인 요청 버튼 */}
      {failed > 0 && onRequestPing && (
        <button
          onClick={onRequestPing}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow"
        >
          🚀 색인 요청 (실패 {failed}건)
        </button>
      )}

      {/* ✅ 등록 성공 리스트 */}
      {successList.length > 0 && (
        <div>
          <h3 className="text-green-600 font-semibold mb-2">✅ 등록 완료 목록 ({successList.length}건)</h3>
          <ul className="space-y-2">
            {successList.map((item, i) => {
              const url = typeof item === "string" ? item : item.url;
              const google = typeof item === "object" ? item.google : undefined;
              const bing = typeof item === "object" ? item.bing : undefined;
              const naver = typeof item === "object" ? item.naver : undefined;
              return (
                <li key={i} className="p-4 border border-green-300 rounded-md text-sm bg-green-50">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline break-all">
                    🔗 {url}
                  </a>
                  {google !== undefined && (
                    <p className="text-xs mt-1 text-green-700">
                      Google: {google ? "✅ 등록됨" : "❌ 미등록"} &nbsp;|&nbsp;
                      Bing: {bing ? "✅ 등록됨" : "❌ 미등록"} &nbsp;|&nbsp;
                      Naver: {naver ? "✅ 등록됨" : "❌ 미등록"}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ❌ 색인되지 않은 글 (등록 전 실패 상태 포함) */}
      {failedList.length > 0 && (
        <div>
          <h3 className="text-red-500 font-semibold mb-2">❌ 색인되지 않은 글 목록 ({failedList.length}건)</h3>
          <ul className="space-y-2">
            {failedList.map((item, i) => {
              const url = typeof item === "string" ? item : item.url;
              const google = typeof item === "object" ? item.google : undefined;
              const bing = typeof item === "object" ? item.bing : undefined;
              const naver = typeof item === "object" ? item.naver : undefined;
              return (
                <li key={i} className="p-4 border border-red-300 rounded-md text-sm bg-red-50">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 underline break-all">
                    🔗 {url}
                  </a>
                  {google !== undefined && (
                    <p className="text-xs mt-1 text-red-600">
                      Google: {google ? "✅ 등록됨" : "❌ 미등록"} &nbsp;|&nbsp;
                      Bing: {bing ? "✅ 등록됨" : "❌ 미등록"} &nbsp;|&nbsp;
                      Naver: {naver ? "✅ 등록됨" : "❌ 미등록"}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultSection;
