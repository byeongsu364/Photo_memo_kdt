import { useNavigate } from 'react-router-dom'

export const useHeader = ({ isAuthed, onLogout }) => {
    const navigate = useNavigate()

    const goHome = (e) => {
        e?.preventDefault?.()
        navigate('/')
    }

    const handleLogout = async () => {
        if (!window.confirm('정말 로그아웃 하시겠어요?')) return
        try {
            await onLogout()
            navigate('/')
        } catch (error) {
            console.error('로그아웃 실패', error)
        }
    }

    const writePath = isAuthed
        ? '/user/dashboard'
        : '/admin/login'

    return {
        goHome,
        handleLogout,
        writePath
    }
}
