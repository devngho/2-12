import pkg from 'jsonwebtoken';
import * as express from 'express';

const { verify } = pkg;
/**
 * 
 * @param {import('../auth.js').AuthenticatedRequest} req 
 * @param {express.Response} res 
 * @param {express.NextFunction} next 
 * @returns 
 */
const verifyToken = (req, res, next) => {
    // 프론트엔드에서 Headers에 'Authorization: Bearer 토큰값' 형태로 보냄
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).json({ error: ' 접근 권한이 없습니다. 로그인이 필요합니다.' });

    const token = authHeader.split(' ')[1]; // "Bearer " 뒷부분의 토큰만 추출
    if (!token) return res.status(401).json({ error: '토큰 형식이 올바르지 않습니다.' });

    try {
        //@ts-ignore
        const decoded = verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        req.user = decoded; // { id, role, name } 정보가 들어있음
        next(); // 다음 라우터로 통과!
    } catch (error) {
        res.status(400).json({ error: '유효하지 않은 토큰입니다.' });
    }
};

export default verifyToken;