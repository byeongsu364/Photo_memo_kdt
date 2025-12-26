import React from 'react'
import "./styles/AuthModal.scss"
import { useAuthModal } from './hooks/useAuthModal'

const AuthModal = ({ open, onClose, onAuthed }) => {
    const {
        mode,
        form,
        loading,
        err,
        attemptInfo,
        setMode,
        handleChange,
        submit,
        closeIfNotLoading
    } = useAuthModal({ open, onClose, onAuthed })

    if (!open) return null

    return (
        <div className='am-backdrop' onClick={closeIfNotLoading}>
            <div className='am-panel' onClick={(e) => e.stopPropagation()}>

                {/* 탭 */}
                <div className='am-tabs'>
                    <button
                        type='button'
                        className={mode === 'login' ? 'on' : ''}
                        onClick={() => setMode('login')}
                    >
                        로그인
                    </button>
                    <button
                        type='button'
                        className={mode === 'register' ? 'on' : ''}
                        onClick={() => setMode('register')}
                    >
                        회원가입
                    </button>
                </div>

                {/* 폼 */}
                <form className='am-form' onSubmit={submit}>
                    {mode === 'register' && (
                        <input
                            type="text"
                            name='displayName'
                            value={form.displayName}
                            onChange={handleChange}
                            placeholder='닉네임'
                        />
                    )}

                    <input
                        type="email"
                        name='email'
                        value={form.email}
                        onChange={handleChange}
                        placeholder='이메일'
                        required
                    />

                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder='비밀번호'
                        required
                    />

                    {/* 메시지 */}
                    {err && (
                        <div
                            className={`am-msg ${attemptInfo.locked ? 'warn' : 'error'}`}
                            role='alert'
                        >
                            {err}
                        </div>
                    )}

                    {attemptInfo.locked ? (
                        <div className="am-msg warn">
                            유효성 검증 실패로 로그인이 차단 되었습니다.
                        </div>
                    ) : attemptInfo.attempts != null ? (
                        <div className='am-subtle'>
                            로그인 실패 횟수: {attemptInfo.attempts}/5
                            {typeof attemptInfo.remaining === 'number' &&
                                ` (남은 시도: ${attemptInfo.remaining})`}
                        </div>
                    ) : null}

                    <button
                        type='submit'
                        className="btn primary"
                        disabled={loading || attemptInfo.locked}
                    >
                        {loading
                            ? '처리중...'
                            : mode === 'register'
                                ? '가입하기'
                                : '로그인'}
                    </button>
                </form>

                <button
                    type='button'
                    onClick={closeIfNotLoading}
                    className='am-close'
                    aria-label='닫기'
                >
                    X
                </button>
            </div>
        </div>
    )
}

export default AuthModal
