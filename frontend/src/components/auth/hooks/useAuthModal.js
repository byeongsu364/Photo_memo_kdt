import { useEffect, useState } from 'react'
import api from '../../../api/client'

export const useAuthModal = ({ open, onClose, onAuthed }) => {
    const [mode, setMode] = useState('register')

    const [attemptInfo, setAttemptInfo] = useState({
        attempts: null,
        remaining: null,
        locked: false
    })

    const [form, setForm] = useState({
        email: '',
        password: '',
        displayName: ''
    })

    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState('')

    /* 🔹 모달 열림/닫힘 초기화 */
    useEffect(() => {
        if (!open) {
            setMode('register')
            setForm({ email: '', password: '', displayName: '' })
            setAttemptInfo({ attempts: null, remaining: null, locked: false })
            setLoading(false)
            setErr('')
        }
    }, [open])

    /* 🔹 ESC 닫기 */
    useEffect(() => {
        if (!open) return

        const onKey = (e) => {
            if (e.key === 'Escape' && !loading) onClose?.()
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [open, loading, onClose])

    /* 🔹 입력 변경 */
    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    /* 🔹 submit */
    const submit = async (e) => {
        e.preventDefault()
        if (loading) return

        setLoading(true)
        setErr('')

        try {
            const payload = mode === 'register'
                ? {
                    email: form.email.trim(),
                    password: form.password.trim(),
                    displayName: form.displayName.trim()
                }
                : {
                    email: form.email.trim(),
                    password: form.password.trim()
                }

            const url = mode === 'register'
                ? '/api/auth/register'
                : '/api/auth/login'

            const { data } = await api.post(url, payload)

            setAttemptInfo({ attempts: null, remaining: null, locked: false })
            setErr('')

            onAuthed?.(data)
            onClose?.()

        } catch (error) {
            const d = error?.response?.data || {}

            setAttemptInfo({
                attempts: typeof d.loginAttempts === 'number' ? d.loginAttempts : null,
                remaining: typeof d.remainingAttempts === 'number' ? d.remainingAttempts : null,
                locked: !!d.locked
            })

            setErr(
                d.message ||
                (mode === 'register' ? '회원가입 실패' : '로그인 실패')
            )
        } finally {
            setLoading(false)
        }
    }

    const closeIfNotLoading = () => {
        if (!loading) onClose?.()
    }

    return {
        /* state */
        mode,
        form,
        loading,
        err,
        attemptInfo,

        /* actions */
        setMode,
        handleChange,
        submit,
        closeIfNotLoading
    }
}
