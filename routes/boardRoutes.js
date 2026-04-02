import { Router } from 'express';
import { genSalt, hash } from 'bcryptjs';
import Board from '../models/Board.js';
import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';

const router = Router();

router.post('/', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  const { category, content, deadline, dDayAlarm } = req.body;
  const parsedDeadline = deadline ? new Date(deadline) : undefined;

  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  if (category === '공지' && !['관리자', '반장', '부반장'].includes(req.user.role)) {
    return res.status(403).json({ error: '공지는 관리자, 반장, 부반장만 작성할 수 있습니다.' });
  }

  try {
    const newBoard = new Board({
      category,
      content,
      deadline: parsedDeadline,
      dDayAlarm,
      authorId: req.user.id,
      authorRole: req.user.role,
      authorName: req.user.name
    });

    await newBoard.save();
    res.status(201).json({ message: '글이 등록되었습니다.', data: newBoard });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '글 등록 오류' });
  }
});

// [기능 2] 전체 공지 조회 (분야별 필터링은 프론트에서 처리하거나 쿼리로 처리)
router.get('/', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  try {
    const { category } = req.query;
    /** @type {{ category?: string }} */
    const query = {};

    if (category) {
      // check is category is string
      if (typeof category !== 'string') {
        return res.status(400).json({ error: '카테고리 쿼리는 문자열이어야 합니다.' });
      }

      query.category = category;
    }

    const boards = await Board.find(query).sort({ createdAt: -1 });
    res.status(200).json(boards);
  } catch (error) {
    res.status(500).json({ error: '글 조회 오류' });
  }
});

// [기능 3] 알림창 전용 데이터 (D-Day 임박한 수행평가만 추출)
router.get('/alerts', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  const { category } = req.query;

  if (category && typeof category !== 'string') {
    return res.status(400).json({ error: '카테고리 쿼리는 문자열이어야 합니다.' });
  }

  try {
    const boards = category ? await Board.find({ category }).sort({ deadline: 1 }) : await Board.find().sort({ deadline: 1 });
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

// [기능 4] 비밀번호 변경 (반장, 부반장, 관리자 전용)
router.patch('/change-pw', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  const { targetId, newPassword } = req.body;

  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  if (!['관리자', '반장', '부반장'].includes(req.user.role)) {
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
