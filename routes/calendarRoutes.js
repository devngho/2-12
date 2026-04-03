import express from 'express';
const { Router } = express;

import CalendarEvent from '../models/CalendarEvent.js';
import verifyToken from '../middleware/auth.js';

const router = Router();

const PRIVILEGED_ROLES = ['관리자', '반장', '부반장', '선생님'];

// 특정 월의 일정 조회
router.get('/', verifyToken, async (req, res) => {
  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'year, month 쿼리가 필요합니다.' });
  }

  try {
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const events = await CalendarEvent.find({
      date: { $regex: `^${prefix}` }
    }).sort({ date: 1, createdAt: 1 });

    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '일정 조회 오류' });
  }
});

// 수동 일정 추가 (반장/부반장/선생님만)
router.post('/', verifyToken, /** @param {import('../auth').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });
  if (!PRIVILEGED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: '일정 추가 권한이 없습니다.' });
  }

  const { date, title, content } = req.body;
  if (!date || !title) {
    return res.status(400).json({ error: 'date, title은 필수입니다.' });
  }

  try {
    const event = new CalendarEvent({
      date,
      title,
      content: content || '',
      authorId: req.user.id,
      source: 'manual',
    });
    await event.save();
    res.status(201).json({ message: '일정이 추가되었습니다.', data: event });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '일정 추가 오류' });
  }
});

// 일정 수정 (수동 일정만, 반장/부반장/선생님만)
router.patch('/:id', verifyToken, /** @param {import('../auth').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });
  if (!PRIVILEGED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: '일정 수정 권한이 없습니다.' });
  }

  try {
    const event = await CalendarEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    if (event.source !== 'manual') {
      return res.status(403).json({ error: '수행평가 연동 일정은 원글에서 수정해주세요.' });
    }

    const { title, content, date } = req.body;
    if (title) event.title = title;
    if (content !== undefined) event.content = content;
    if (date) event.date = date;
    await event.save();
    res.json({ message: '일정이 수정되었습니다.', data: event });
  } catch (error) {
    res.status(500).json({ error: '일정 수정 오류' });
  }
});

// 일정 삭제 (수동 일정만, 반장/부반장/선생님만)
router.delete('/:id', verifyToken, /** @param {import('../auth').AuthenticatedRequest} req */ async (req, res) => {
  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });
  if (!PRIVILEGED_ROLES.includes(req.user.role)) {
    return res.status(403).json({ error: '일정 삭제 권한이 없습니다.' });
  }

  try {
    const event = await CalendarEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    if (event.source !== 'manual') {
      return res.status(403).json({ error: '수행평가 연동 일정은 원글에서 삭제해주세요.' });
    }

    await CalendarEvent.findByIdAndDelete(req.params.id);
    res.json({ message: '일정이 삭제되었습니다.' });
  } catch (error) {
    res.status(500).json({ error: '일정 삭제 오류' });
  }
});

export default router;
