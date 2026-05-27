import express from 'express';
import bcryptjs from 'bcryptjs';
import pkg from 'jsonwebtoken';

const { Router } = express;
const { genSalt, hash, compare } = bcryptjs;
const { sign } = pkg;

import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';
const router = Router();

// 가입 상태 확인 (프론트에서 탭 숨김 처리용)
router.get('/registration-status', async (req, res) => {
    try {
        const hasAdmin = async () => await User.exists({ role: '관리자' }) !== null;
        const hasTeacher = async () => await User.exists({ role: '선생님', isApproved: true }) !== null;
        const hasPresident = async () => await User.exists({ role: '반장', isApproved: true }) !== null;
        const hasVicePresident = async () => await User.exists({ role: '부반장', isApproved: true }) !== null;

        const [admin, teacher, president, vicePresident] = await Promise.all([
            hasAdmin(),
            hasTeacher(),
            hasPresident(),
            hasVicePresident()
        ]);

        res.json({ admin, teacher, president, vicePresident });
    } catch (error) {
        res.status(500).json({ error: '상태 확인 중 오류 발생' });
    }
});

// 회원가입
router.post('/register', async (req, res) => {
    const { studentId, name, password, role } = req.body;
    try {
        const existingUser = await User.findOne({ studentId });
        if (existingUser) return res.status(400).json({ error: '이미 존재하는 학번입니다.' });

        if (role === '관리자' && await User.exists({ role: '관리자' })) {
            return res.status(403).json({ error: '관리자 계정은 1개만 생성 가능합니다.' });
        }

        const salt = await genSalt(10);
        const hashedPassword = await hash(password, salt);

        const newUser = new User({
            studentId, name, password: hashedPassword, role,
            isApproved: role === '관리자' // 관리자는 즉시 승인
        });

        await newUser.save();
        res.status(201).json({ message: '회원가입 완료. 승인을 대기해주세요.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '회원가입 오류' });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    const { studentId, password } = req.body;
    try {
        const user = await User.findOne({ studentId });
        if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        if (!user.isApproved) return res.status(403).json({ error: '관리자 승인이 필요합니다.' });

        const isMatch = await compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: '비밀번호가 틀렸습니다.' });

        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ error: '서버 인증 설정 오류' });
        }

        const token = sign({ id: user.studentId, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000,
            path: '/'
        });

        res.json({ message: '로그인 성공', role: user.role, name: user.name });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '로그인 오류' });
    }
});

router.post('/logout', async (req, res) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
    });

    res.json({ message: '로그아웃 완료' });
});

router.get('/session', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
    if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });
    res.json({ id: req.user.id, name: req.user.name, role: req.user.role });
});

// 관리자 승인 (임시로 바디에서 adminId를 받는 방식)
router.patch('/approve/:userId', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
    if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });
    if (req.user.role !== '관리자') return res.status(403).json({ error: '승인 권한이 없습니다.' });

    try {
        const targetUser = await User.findById(req.params.userId);
        if (!targetUser) return res.status(404).json({ error: '대상 사용자를 찾을 수 없습니다.' });

        if (['선생님', '반장', '부반장'].includes(targetUser.role) && await User.exists({ role: targetUser.role, isApproved: true })) {
            return res.status(400).json({ error: `이미 승인된 ${targetUser.role}이(가) 있습니다.` });
        }
        targetUser.isApproved = true;
        await targetUser.save();
        res.json({ message: '승인 완료' });
    } catch (error) {
        res.status(500).json({ error: '승인 오류' });
    }
});

router.get('/pending-approve', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
    if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });
    if (req.user.role !== '관리자') return res.status(403).json({ error: '승인 권한이 없습니다.' });

    try {
        const pendingUsers = await User.find({ isApproved: false }, 'studentId name role');
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ error: '대기 사용자 조회 오류' });
    }
});


export default router;