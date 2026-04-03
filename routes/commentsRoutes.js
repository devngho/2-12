import { Router } from 'express';
import Board from '../models/Board.js';
import verifyToken from '../middleware/auth.js';

const router = Router()

/**
 * @param {Array<{ nickname: string, content: string, commentedAt: Date }>} comments
 * @returns {Array<{ nickname: string, content: string, commentedAt: Date }>}
 */
export function redactAuthorId(comments) {
  return comments.map(comment => ({
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
      authorId: req.user.id,
      authorRole: req.user.role,
      authorName: req.user.name
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