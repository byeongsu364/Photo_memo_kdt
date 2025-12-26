export const useLanding = () => {
    const isAuthed = !!localStorage.getItem('token')

    const writePath = isAuthed
        ? '/user/dashboard'
        : '/admin/login'

    return {
        writePath
    }
}
