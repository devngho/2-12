import express from 'express';
import bcryptjs from 'bcryptjs';

const { Router } = express;
const { genSalt, hash } = bcryptjs;

import multer, { diskStorage } from 'multer';
import { extname } from 'path';
import Board from '../models/Board.js';
import User from '../models/User.js';
import CalendarEvent from '../models/CalendarEvent.js';
import verifyToken from '../middleware/auth.js';
import { redactAuthorId } from './commentRoutes.js';

const router = Router();

const PRIVILEGED_ROLES = ['관리자', '반장', '부반장', '선생님'];

// 글 등록
const storage = diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + extname(file.originalname))
});
const upload = multer({ storage: storage, limits: { fileSize: 1 * 1024 * 1024 * 1024 } }); // 1GiB

router.post('/', verifyToken, upload.array('files'), /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  const { title, category, content, nickname, deadline, dDayAlarm } = req.body;
  const parsedDeadline = deadline ? new Date(deadline) : undefined;
  const parsedDeadlineTime = parsedDeadline?.getTime();
  const parsedDdayAlarm = typeof dDayAlarm === 'string' ? Number.parseInt(dDayAlarm, 10) : dDayAlarm;
  const uploadedFiles = Array.isArray(req.files)
    ? req.files.map((file) => ({
      fileName: file.originalname,
      filePath: file.path
    }))
    : [];

  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  if (category === '공지' && !PRIVILEGED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: '공지는 관리자, 반장, 부반장, 선생님만 작성할 수 있습니다.' });
  }

  if (category === '수행' && !PRIVILEGED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: '수행평가는 관리자, 반장, 부반장, 선생님만 작성할 수 있습니다.' });
  }
  
  if (typeof title !== 'string' || typeof category !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'title, category, content는 문자열이어야 합니다.' });
  }

  if (parsedDeadlineTime !== undefined && Number.isNaN(parsedDeadlineTime)) {
    return res.status(400).json({ error: 'deadline 형식이 올바르지 않습니다.' });
  }

  if (parsedDdayAlarm !== undefined && (typeof parsedDdayAlarm !== 'number' || Number.isNaN(parsedDdayAlarm))) {
    return res.status(400).json({ error: 'dDayAlarm은 숫자여야 합니다.' });
  }

  if (category === '공지' && !['관리자', '반장', '부반장'].includes(req.user.role)) {
    return res.status(403).json({ error: '공지는 관리자, 반장, 부반장만 작성할 수 있습니다.' });
  }

  try {
    const newBoard = new Board({
      title,
      category,
      content,
      nickname: nickname || undefined,
      deadline: parsedDeadline,
      dDayAlarm: parsedDdayAlarm,
      authorId: req.user.id,
      authorName: req.user.name,
      files: uploadedFiles
    });

    await newBoard.save();

    // 수행평가 + 마감일이 있으면 캘린더에 자동 등록
    if (category === '수행평가' && parsedDeadline) {
      const dateKey = `${parsedDeadline.getFullYear()}-${String(parsedDeadline.getMonth() + 1).padStart(2, '0')}-${String(parsedDeadline.getDate()).padStart(2, '0')}`;
      const calEvent = new CalendarEvent({
        date: dateKey,
        title: `[수행평가] ${title}`,
        content: content,
        authorId: req.user.id,
        source: 'assessment',
        boardId: newBoard._id,
      });
      await calEvent.save();
    }

    res.status(201).json({ message: '글이 등록되었습니다.', data: newBoard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '글 등록 오류' });
  }
});

// 전체 글 조회 (isDeleted: false만)
router.get('/', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  try {
    const { category } = req.query;
    /** @type {Record<string, any>} */
    const query = { isDeleted: false };

    if (category) {
      if (typeof category !== 'string') {
        return res.status(400).json({ error: '카테고리 쿼리는 문자열이어야 합니다.' });
      }
      query.category = category;
    }

    const boards = await Board.find(query).sort({ createdAt: -1 });
    res.status(200).json(boards.map((board) => ({
      id: board._id,
      title: board.title,
      category: board.category,
      content: board.content,
      deadline: board.deadline,
      dDayAlarm: board.dDayAlarm,
      authorId: board.authorId,
      authorName: board.authorName,
      files: board.files,
      createdAt: board.createdAt,
      comments: redactAuthorId(board.comments)
    })));
  } catch (error) {
    res.status(500).json({ error: '글 조회 오류' });
  }
});

// 알림창 전용 데이터 (D-Day 임박한 수행평가만 추출)
router.get('/alerts', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  const { category } = req.query;

  if (category && typeof category !== 'string') {
    return res.status(400).json({ error: '카테고리 쿼리는 문자열이어야 합니다.' });
  }

  try {
    /** @type {Record<string, any>} */
    const filter = { isDeleted: false };
    if (category) filter.category = category;
    const boards = await Board.find(filter).sort({ deadline: 1 });
    const today = new Date();

    const alerts = boards.filter((board) => {
      if (!board.deadline) return false;

      const diffTime = board.deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays <= board.dDayAlarm && diffDays >= 0;
    });

    res.status(200).json(alerts);
  } catch (error) {
    res.status(500).json({ error: '알림 조회 오류' });
  }
});

// 글 수정 (작성자 또는 반장/부반장/선생님/관리자)
router.patch('/:id', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });

    const isAuthor = board.authorId === req.user.id;
    const isPrivileged = PRIVILEGED_ROLES.includes(req.user.role);

    if (!isAuthor && !isPrivileged) {
      return res.status(403).json({ error: '수정 권한이 없습니다.' });
    }

    // 수정 전 원본을 editHistory에 기록 (감사 로그)
    board.editHistory.push({
      title: board.title,
      content: board.content,
      deadline: board.deadline,
      editedAt: new Date()
    });

    const { title, content, deadline } = req.body;
    if (title !== undefined) board.title = title;
    if (content !== undefined) board.content = content;

    // 수행평가 글의 경우 마감일도 수정 가능
    if (board.category === '수행' && deadline !== undefined) {
      const oldDeadline = board.deadline;
      board.deadline = deadline ? new Date(deadline) : null;

      // 연동된 CalendarEvent 업데이트
      if (board.deadline) {
        const dateKey = `${board.deadline.getFullYear()}-${String(board.deadline.getMonth() + 1).padStart(2, '0')}-${String(board.deadline.getDate()).padStart(2, '0')}`;
        await CalendarEvent.findOneAndUpdate(
          { boardId: board._id, source: 'assessment' },
          {
            date: dateKey,
            title: `[수행평가] ${board.title}`,
            content: board.content
          }
        );
      } else {
        // 마감일 제거 시 CalendarEvent도 삭제
        await CalendarEvent.deleteOne({ boardId: board._id, source: 'assessment' });
      }
    }

    await board.save();
    res.json({ message: '글이 수정되었습니다.', data: board });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '글 수정 오류' });
  }
});

// 글 삭제 — Soft Delete (작성자 또는 반장/부반장/선생님/관리자)
router.delete('/:id', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });

    const isAuthor = board.authorId === req.user.id;
    const isPrivileged = PRIVILEGED_ROLES.includes(req.user.role);

    if (!isAuthor && !isPrivileged) {
      return res.status(403).json({ error: '삭제 권한이 없습니다.' });
    }

    board.isDeleted = true;
    await board.save();

    // 수행평가 연동 CalendarEvent도 삭제
    if (board.category === '수행') {
      await CalendarEvent.deleteOne({ boardId: board._id, source: 'assessment' });
    }

    res.json({ message: '글이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '글 삭제 오류' });
  }
});

// 비밀번호 변경 (반장, 부반장, 관리자 전용)
router.patch('/change-pw', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  const { targetId, newPassword } = req.body;

  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  if (!PRIVILEGED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: '비밀번호 수정 권한이 없습니다.' });
  }

  try {
    const targetUser = await User.findById(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: '대상 사용자를 찾을 수 없습니다.' });
    }

    const salt = await genSalt(10);
    targetUser.password = await hash(newPassword, salt);
    await targetUser.save();

    res.json({ message: '비밀번호가 변경되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '비밀번호 변경 오류' });
  }
});

export default router;
