import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './styles/Header.scss';

const Header = ({ isAuthed, user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        if (!window.confirm('정말 로그아웃 하시겠어요?')) return;
        try {
            await onLogout();
            navigate('/');
        } catch (error) {
            console.error('로그아웃 실패', error);
        }
    };

    // ✅ 로고 클릭 → 항상 홈으로 이동
    const goHome = (e) => {
        e?.preventDefault?.();
        navigate('/');
    };

    return (
        <header className="site-header">
            <div className="inner">
                {/* ✅ 로고 */}
                <h1 className="logo" onClick={goHome} role="button" tabIndex={0}>
                    <Link to="/" className="logo-link" onClick={goHome} aria-label="홈으로 이동">
                        <span className="logo-emoji" aria-hidden>📷</span>
                        <span className="logo-text">Photomemo</span>
                    </Link>
                </h1>

                {/* ✅ 우측 영역 */}
                <div className="auth-area">
                    {isAuthed ? (
                        <div className="auth-info">
                            <span className="welcome">
                                {user?.displayName || user?.email || 'user'}
                            </span>

                            {/* ✅ 마이페이지 버튼 */}
                            <Link to="/user/mypage" className="btn mypage">
                                마이페이지
                            </Link>

                            <button className="btn logout" onClick={handleLogout}>
                                로그아웃
                            </button>
                        </div>
                    ) : (
                        <div className="guest-links">
                            <Link to="/" className="btn login">로그인</Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
