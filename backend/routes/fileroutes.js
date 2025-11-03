const express = require("express");
const router = express.Router();
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { presignPut } = require("../src/s3");

router.get("/ping", (req, res) => res.json({ ok: true }));

router.post("/presign", async (req, res) => {
    try {
        console.log("📩 받은 요청 body:", req.body); // ✅ 이 줄 꼭 있음?
        const { filename, contentType } = req.body;
        if (!filename || !contentType)
            return res.status(400).json({ message: "filename/contentType은 필수입니다." });

        const key = `uploads/${Date.now()}-${uuidv4()}${path.extname(filename)}`;
        const url = await presignPut(key, contentType);
        res.json({ url, key });
    } catch (error) {
        console.error("❌ presign 실패:", error);
        res.status(500).json({ message: "presign 생성 실패", error: error.message });
    }
});


module.exports = router;
