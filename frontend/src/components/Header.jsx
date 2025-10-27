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

    // ✅ 로고 클릭 → 항상 루트 이동 (Link + onClick 이중 보호)
    const goHome = (e) => {
        // 혹시 상위에서 click 막는 경우 대비
        e?.preventDefault?.();
        navigate('/');
    };

    return (
        <header className="site-header">
            <div className="inner">
                {/* Link + onClick 이중 처리 */}
                <h1 className="logo" onClick={goHome} role="button" tabIndex={0}>
                    <Link to="/" className="logo-link" onClick={goHome} aria-label="홈으로 이동">
                        <span className="logo-emoji" aria-hidden>📷</span>
                        <span className="logo-text">Photomemo</span>
                    </Link>
                </h1>

                <div className="auth-area">
                    {isAuthed && (
                        <div className="auth-info">
                            <span className="welcome">
                                {user?.displayName || user?.email || 'user'}
                            </span>
                            <button className="btn logout" onClick={handleLogout}>
                                로그아웃
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
