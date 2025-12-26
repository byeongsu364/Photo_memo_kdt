import React from 'react'
import { Link } from 'react-router-dom'
import './styles/Header.scss'
import { useHeader } from './hooks/useHeader'

const Header = ({ isAuthed, user, onLogout }) => {

    const {
        goHome,
        handleLogout,
        writePath
    } = useHeader({ isAuthed, onLogout })

    return (
        <header className="site-header">
            <div className="inner">

                {/* 로고 */}
                <h1 className="logo" onClick={goHome} role="button" tabIndex={0}>
                    <Link to="/" className="logo-link" onClick={goHome}>
                        <span className="logo-emoji">📷</span>
                        <span className="logo-text">Photomemo</span>
                    </Link>
                </h1>

                {/* 중앙 네비 */}
                <nav className="center-nav">
                    <Link to={writePath} className="nav-item">글쓰기</Link>
                    <Link to="/posts" className="nav-item">리스트 보기</Link>
                </nav>

                {/* 우측 */}
                <div className="auth-area">
                    {isAuthed ? (
                        <div className="auth-info">
                            <span className="welcome">
                                {user?.displayName || user?.email || 'user'}
                            </span>
                            <div className="auth-btn-wrap">
                                <Link to="/user/mypage" className="btn mypage">
                                    마이페이지
                                </Link>
                                <button className="btn logout" onClick={handleLogout}>
                                    로그아웃
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="guest-links">
                            <Link to="/admin/login" className="btn login">
                                로그인
                            </Link>
                        </div>
                    )}
                </div>

            </div>
        </header>
    )
}

export default Header
