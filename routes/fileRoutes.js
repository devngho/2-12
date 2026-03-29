import express from 'express';
import multer from 'multer';
import { unlink } from 'fs';
import { extname } from 'path';

const { Router } = express;
const { diskStorage } = multer;

import File from '../models/File.js';
import verifyToken from '../middleware/auth.js';

const router = Router();

const storage = diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + extname(file.originalname))
});
const upload = multer({ storage: storage, limits: { fileSize: 1 * 1024 * 1024 * 1024 } }); // 1GiB

// 카테고리별 자료 조회 (로그인한 사람만 볼 수 있게 설정)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) query.category = category;
        const files = await File.find(query).sort({ uploadDate: -1 });
        res.status(200).json(files);
    } catch (error) {
        res.status(500).json({ error: "자료 조회 오류" });
    }
});

router.post('/upload', verifyToken, upload.single('file'), /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "인증이 필요합니다." });
    if (!req.file) return res.status(400).json({ error: "파일이 첨부되지 않았습니다." });

    try {
        const newFile = new File({
            filename: req.file.filename,
            originalName: req.file.originalname,
            filePath: req.file.path,
            size: req.file.size,
            authorId: req.user.id,
            description: req.body.description,
            preserve: req.body.preserve === true
        });
        await newFile.save();
        res.status(201).json({ message: "업로드 성공", fileId: newFile._id });
    } catch (error) {
        res.status(500).json({ error: "업로드 오류" });
    }
});

// 필수 보존 토글 (반장이나 관리자만 가능하게 하려면 로직 추가 가능)
router.patch('/:id/preserve', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "인증이 필요합니다." });
    if (!['반장', '관리자'].includes(req.user.role)) {
        return res.status(403).json({ error: "권한이 없습니다." });
    }

    const { preserve } = req.body;

    if (typeof preserve !== 'boolean') {
        return res.status(400).json({ error: "preserve 필드는 boolean이어야 합니다." });
    }

    try {
        const file = await File.findById(req.params.id);

        if (!file) return res.status(404).json({ error: "파일 없음" });

        file.preserve = preserve;
        await file.save();
        res.json({ message: "보존 설정 변경됨", preserve: file.preserve });
    } catch (error) {
        res.status(500).json({ error: "설정 변경 오류" });
    }
});

// 자료 삭제 (본인 또는 반장/관리자)
router.delete('/:id', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "인증이 필요합니다." });

    try {
        const file = await File.findById(req.params.id);
        if (!file) return res.status(404).json({ error: "파일 없음" });

        if (file.authorId !== req.user.id && !['반장', '관리자'].includes(req.user.role)) {
            return res.status(403).json({ error: "삭제 권한이 없습니다." });
        }

        unlink(file.filePath, async (err) => {
            if (err && err.code !== 'ENOENT') return res.status(500).json({ error: "물리적 삭제 실패" });
            await File.findByIdAndDelete(req.params.id);
            res.json({ message: "파일 삭제됨" });
        });
    } catch (error) {
        res.status(500).json({ error: "삭제 오류" });
    }
});

export default router;