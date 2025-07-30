import React from "react";

export default function UserLogTable({ logs, date, onRetry }) {
  if (!logs || logs.length === 0) {
    return (
      <div className="bg-white shadow p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">📆 {date} 등록 내역</h2>
        <p className="text-gray-500">등록된 글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow p-4 rounded overflow-x-auto">
      <h2 className="text-lg font-semibold mb-3">📆 {date} 등록 내역 ({logs.length}건)</h2>
      <table className="w-full text-sm table-auto border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">URL</th>
            <th className="p-2 text-center">결과</th>
            <th className="p-2 text-center">Google</th>
            <th className="p-2 text-center">Bing</th>
            <th className="p-2 text-center">액션</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-2 text-blue-700 truncate max-w-[300px]">{log.url}</td>
              <td className="p-2 text-center">{log.result === "success" ? "✅" : "❌"}</td>
              <td className="p-2 text-center">{log.engines?.google ? "✅" : "❌"}</td>
              <td className="p-2 text-center">{log.engines?.bing ? "✅" : "❌"}</td>
              <td className="p-2 text-center">
                {log.result === "fail" && (
                  <button
                    onClick={() => onRetry(log.url)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    🔁 재시도
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
