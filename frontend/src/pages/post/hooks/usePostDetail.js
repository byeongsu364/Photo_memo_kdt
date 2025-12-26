import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { fetchGroupMemos, fetchPostDetail } from "../../../api/client"

export const usePostDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [group, setGroup] = useState(null)
    const [single, setSingle] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let mounted = true

        const loadData = async () => {
            setLoading(true)

            try {
                // 1️⃣ 그룹 게시글 시도
                const groupData = await fetchGroupMemos(id)
                if (
                    mounted &&
                    groupData &&
                    Array.isArray(groupData.items) &&
                    groupData.items.length >= 1
                ) {
                    setGroup(groupData)
                    setSingle(null)
                    return
                }
            } catch {
                // 그룹 아님 → 단일로 넘어감
            }

            try {
                // 2️⃣ 단일 게시글 시도
                const postData = await fetchPostDetail(id)
                if (mounted && postData) {
                    setSingle(postData)
                    setGroup(null)
                }
            } catch (err) {
                console.error("❌ 게시글 로드 실패:", err)
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
        single,
        goBack
    }
}
