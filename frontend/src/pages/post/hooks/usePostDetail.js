import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchGroupMemos } from "../../../api/client"

export const usePostDetail = () => {
    const { id } = useParams() // 🔥 id === groupId
    const navigate = useNavigate()

    const [group, setGroup] = useState(null)
    const [single, setSingle] = useState(null) // 구조 유지
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const loadData = async () => {
            setLoading(true)

            try {
                const groupData = await fetchGroupMemos(id)

                if (
                    mounted &&
                    groupData &&
                    Array.isArray(groupData.items)
                ) {
                    setGroup(groupData)
                    setSingle(null)
                } else {
                    setGroup(null)
                    setSingle(null)
                }
            } catch (err) {
                console.error("❌ 그룹 게시글 로드 실패:", err)
                if (mounted) {
                    setGroup(null)
                    setSingle(null)
                }
            } finally {
                mounted && setLoading(false)
            }
        }

        loadData()

        return () => {
            mounted = false
        }
    }, [id])

    const goBack = () => navigate(-1)

    return {
        loading,
        group,
        single, // 그대로 유지
        goBack
    }
}
