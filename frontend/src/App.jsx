import './App.scss'
import { Routes, Route, Navigate, useLocation } from "react-router-dom"

import Header from './components/common/Header'
import AuthPanel from "./components/auth/AuthPanel"
import ProtectedRoute from "./routes/ProtectedRoute"

import Landing from "./pages/home/Landing"
import AdminDashboard from './pages/admin/AdminDashboard'
import UserDashboard from './pages/user/UserDashboard'
import UploadForm from "./pages/user/UploadForm"
import FileList from "./pages/user/FileList"
import Posts from "./pages/post/Posts"
import PostsContainer from "./pages/post/PostsContainer"
import PostDetail from "./pages/post/PostDetail"
import PostDetailContainer from "./pages/post/PostDetailContainer"
import MyPage from "./pages/user/MyPage"

import { useAuth } from "./hooks/useAuth"

function App() {
    const location = useLocation();

    const {
        user,
        me,
        isAuthed,
        handleAuthed,
        handleLogout,
        handleFetchMe,
    } = useAuth();

    /* 헤더 표시 조건 */
    const hideOn = new Set(['/', '/admin/login']);
    const showHeader = isAuthed || !hideOn.has(location.pathname);

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
                <Route path="/" element={<Landing />} />

                <Route path="/posts" element={<PostsContainer />} />
                <Route path="/posts/:id" element={<PostDetailContainer />} />

                <Route
                    path="/admin/login"
                    element={
                        <AuthPanel
                            isAuthed={isAuthed}
                            user={user}
                            me={me}
                            onFetchMe={handleFetchMe}
                            onLogout={handleLogout}
                            onAuthed={handleAuthed}
                            requiredRole="admin"
                        />
                    }
                />

                <Route
                    path="/user"
                    element={
                        <ProtectedRoute
                            isAuthed={isAuthed}
                            user={user}
                            redirect="/"
                        />
                    }
                >
                    <Route index element={<Navigate to="/user/dashboard" replace />} />
                    <Route path="dashboard" element={<UserDashboard />} />
                    <Route path="upload" element={<UploadForm />} />
                    <Route path="files" element={<FileList />} />
                    <Route path="mypage" element={<MyPage />} />
                </Route>

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute
                            isAuthed={isAuthed}
                            user={user}
                            requiredRole="admin"
                        />
                    }
                >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default App;
