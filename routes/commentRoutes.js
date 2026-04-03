import { Router } from 'express';
import Board from '../models/Board.js';
import verifyToken from '../middleware/auth.js';

const router = Router()

/**
 * @param {Array<{ _id: any, nickname: string, content: string, commentedAt: Date, isDeleted: boolean }>} comments
 * @returns {Array<{ id: any, nickname: string, content: string, commentedAt: Date }>}
 */
export function redactAuthorId(comments) {
  return comments.filter(comment => !comment.isDeleted).map(comment => ({
    id: comment._id,
    nickname: comment.nickname,
    content: comment.content,
    commentedAt: comment.commentedAt
  }));
}

router.post('/', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  const { boardId, nickname, content } = req.body;

  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  if (typeof boardId !== 'string' || typeof nickname !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'boardId, nickname, content는 문자열이어야 합니다.' });
  }

  try {
    // find board
    const board = await Board.findById(boardId);
    if (!board) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

    // add comment
    board.comments.push({
      nickname,
      content,
      userId: req.user.id
    });
    await board.save();

    res.status(201).json({ message: '댓글이 등록되었습니다.', data: redactAuthorId(board.comments) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '댓글 등록 오류' });
  }
});

router.get('/:boardId', async (req, res) => {
    const { boardId } = req.params;

    try {
        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });

        res.status(200).json(redactAuthorId(board.comments));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: '댓글 조회 오류' });
    }
});

router.delete('/:commentId', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  const { commentId } = req.params;

  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  if (typeof commentId !== 'string') {
    return res.status(400).json({ error: 'commentId는 문자열이어야 합니다.' });
  }

  try {
    const board = await Board.findOne({ 'comments._id': commentId });
    if (!board) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });

    const comment = board.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });

    if (comment?.userId !== req.user.id && req.user.role !== '관리자') {
      return res.status(403).json({ error: '댓글 삭제 권한이 없습니다.' });
    }
    comment.isDeleted = true;

    await board.save();
    res.json({ message: '댓글이 삭제되었습니다.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '댓글 삭제 오류' });
  }
});

router.patch('/:commentId', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  if (!req.user) return res.status(401).json({ error: '인증이 필요합니다.' });

  if (typeof commentId !== 'string' || typeof content !== 'string') {
    return res.status(400).json({ error: 'commentId와 content는 문자열이어야 합니다.' });
  }

  try {
    const board = await Board.findOne({ 'comments._id': commentId });
    if (!board) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });

    const comment = board.comments.id(commentId);
    if (!comment) return res.status(404).json({ error: '댓글을 찾을 수 없습니다.' });

    if (comment?.userId !== req.user.id && req.user.role !== '관리자') {
      return res.status(403).json({ error: '댓글 수정 권한이 없습니다.' });
    }
    comment.content = content;

    await board.save();
    res.json({ message: '댓글이 수정되었습니다.', data: redactAuthorId(board.comments) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '댓글 수정 오류' });
  }
});

export default router;
