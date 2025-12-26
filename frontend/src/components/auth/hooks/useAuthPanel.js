import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const useAuthPanel = ({
    isAuthed,
    user,
    requiredRole
}) => {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()

    const isAdminPage = requiredRole === 'admin'
    const hasRequiredRole = !requiredRole || (user && user.role === requiredRole)

    /* 🔹 로그인 후 리다이렉트 */
    useEffect(() => {
        if (!isAuthed || !user) return

        if (isAdminPage) {
            if (user.role === 'admin') {
                navigate('/admin/dashboard', { replace: true })
            } else {
                navigate('/user/dashboard', { replace: true })
            }
        } else {
            navigate('/user/dashboard', { replace: true })
        }
    }, [isAuthed, user, isAdminPage, navigate])

    return {
        /* state */
        open,
        hasRequiredRole,
        isAdminPage,

        /* actions */
        openModal: () => setOpen(true),
        closeModal: () => setOpen(false),
    }
}
