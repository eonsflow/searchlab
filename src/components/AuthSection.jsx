import React, { useState } from "react";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";

const AuthSection = ({ onUserChange }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  const handleAuth = async () => {
    setError("");
    try {
      const userCred =
        mode === "login"
          ? await signInWithEmailAndPassword(auth, email, password)
          : await createUserWithEmailAndPassword(auth, email, password);
      onUserChange(userCred.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    onUserChange(null);
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-6">
      {auth.currentUser ? (
        <div className="flex justify-between items-center">
          <div>👤 {auth.currentUser.email}</div>
          <button onClick={handleLogout} className="text-red-500">
            로그아웃
          </button>
        </div>
      ) : (
        <>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 w-full mb-2 rounded"
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 w-full mb-2 rounded"
          />
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <button
            onClick={handleAuth}
            className="bg-blue-600 text-white px-4 py-2 w-full rounded"
          >
            {mode === "login" ? "로그인" : "회원가입"}
          </button>
          <div className="text-center text-sm mt-2">
            {mode === "login" ? (
              <span onClick={() => setMode("signup")} className="text-blue-500 cursor-pointer">
                계정이 없으신가요? 회원가입
              </span>
            ) : (
              <span onClick={() => setMode("login")} className="text-blue-500 cursor-pointer">
                로그인으로 돌아가기
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AuthSection;
