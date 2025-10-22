import './App.scss'
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from "react-router-dom"
import AuthPanel from "./components/AuthPanel"
import Landing from "./pages/Landing"
import Header from './components/Header'
import ProtectRoute from './components/ProtectRoute'
import AdminDashboard from './pages/admin/AdminDashboard'
import UserDashboard from './pages/user/UserDashboard'

// ✅ 추가
import UploadForm from "./pages/user/UploadForm"
import FileList from "./pages/user/FileList"

import {
  fetchMe as apifetchMe,
  logout as apilogout,
  saveAuthToStorage,
  clearAuthStorage
} from "./api/client"

function App() {

  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })

  const [token, setToken] = useState(() => {
    return localStorage.getItem('token')
  })

  const [me, setMe] = useState(null)
  const isAuthed = !!token

  const hideOn = new Set(['/', '/admin/login'])
  const showHeader = isAuthed && !hideOn.has(location.pathname)

  const HandleAuthed = async ({ user, token }) => {
    try {
      setUser(user)
      setToken(token ?? null)
      saveAuthToStorage({ user, token })
      handleFetchMe()
    } catch (error) {
      console.error(error)
    }
  }

  const handleLogout = async () => {
    try {
      await apilogout()
    } catch (error) {
      console.error(error)
    } finally {
      setUser(null)
      setToken(null)
      setMe(null)
      clearAuthStorage()
    }
  }

  const handleFetchMe = async () => {
    try {
      const { user } = await apifetchMe()
      setMe(user)
    } catch (error) {
      setMe({ error: '내정보 조회 실패' })
      console.error(error)
    }
  }

  useEffect(() => {
    if (isAuthed) handleFetchMe()
  }, [isAuthed])

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
        {/* ✅ 랜딩 페이지 */}
        <Route path="/" element={<Landing />} />

        {/* ✅ 관리자 로그인 / 회원가입 */}
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

        {/* ✅ 사용자 보호구역 */}
        <Route
          path="/user"
          element={
            <ProtectRoute
              user={user}
              isAuthed={isAuthed}
              redirect="/admin/login"
            />
          }
        >
          <Route index element={<Navigate to="/user/dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />

          {/* ✅ 새로 추가된 페이지들 */}
          <Route path="upload" element={<UploadForm />} />
          <Route path="files" element={<FileList />} />
        </Route>

        {/* ✅ 관리자 보호구역 */}
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

        {/* ✅ 없는 페이지 → 메인으로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
