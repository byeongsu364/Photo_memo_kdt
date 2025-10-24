import './App.scss'
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from "react-router-dom"
import AuthPanel from "./components/AuthPanel"
import Landing from "./pages/Landing"
import Header from './components/Header'
import ProtectRoute from './components/ProtectRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserDashboard from './pages/user/UserDashboard'

// ✅ 추가된 페이지
import UploadForm from "./pages/user/UploadForm"
import FileList from "./pages/user/FileList"
import Posts from "./pages/Posts"
import PostDetail from "./pages/PostDetail"

import {
  fetchMe as apifetchMe,
  logout as apilogout,
  saveAuthToStorage,
  clearAuthStorage
} from "./api/client"

function App() {
  const location = useLocation(); // ✅ 현재 경로 감지

  /* -------------------------------
     🔹 상태 정의
  --------------------------------*/
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [me, setMe] = useState(null);
  const isAuthed = !!token;

  /* -------------------------------
     🔹 헤더 표시 조건
     → 로그인되어있으면 항상 표시,
        로그인 안됐을 때만 '/' 또는 '/admin/login' 에서 숨김
  --------------------------------*/
  const hideOn = new Set(['/', '/admin/login']);
  const showHeader = isAuthed || !hideOn.has(location.pathname);

  /* -------------------------------
     🔹 인증 처리 함수
  --------------------------------*/
  const HandleAuthed = async ({ user, token }) => {
    try {
      setUser(user);
      setToken(token ?? null);
      saveAuthToStorage({ user, token });
      handleFetchMe();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await apilogout();
    } catch (error) {
      console.error(error);
    } finally {
      setUser(null);
      setToken(null);
      setMe(null);
      clearAuthStorage();
    }
  };

  const handleFetchMe = async () => {
    try {
      const { user } = await apifetchMe();
      setMe(user);
    } catch (error) {
      setMe({ error: '내정보 조회 실패' });
      console.error(error);
    }
  };

  useEffect(() => {
    if (isAuthed) handleFetchMe();
  }, [isAuthed]);

  /* -------------------------------
     🔹 렌더링
  --------------------------------*/
  return (
    <div className="page">
      {showHeader && (
        <Header
          isAuthed={isAuthed}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <Routes>
        {/* ✅ 메인(랜딩) 페이지 */}
        <Route path="/" element={<Landing />} />

        {/* ✅ 전체 게시글 */}
        <Route path="/posts" element={<Posts />} />
        <Route path="/posts/:id" element={<PostDetail />} />

        {/* ✅ 로그인 / 회원가입 */}
        <Route
          path="/admin/login"
          element={
            <AuthPanel
              isAuthed={isAuthed}
              user={user}
              me={me}
              onFetchMe={handleFetchMe}
              onLogout={handleLogout}
              onAuthed={HandleAuthed}
              requiredRole="admin"
            />
          }
        />

        {/* ✅ 사용자 보호 구역 */}
        <Route
          path="/user"
          element={
            <ProtectRoute
              user={user}
              isAuthed={isAuthed}
              redirect="/"
            />
          }
        >
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="upload" element={<UploadForm />} />
          <Route path="files" element={<FileList />} />
        </Route>

        {/* ✅ 관리자 보호 구역 */}
        <Route
          path="/admin"
          element={
            <ProtectRoute
              isAuthed={isAuthed}
              user={user}
              requiredRole="admin"
            />
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>

        {/* ✅ 잘못된 경로 → 메인으로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
