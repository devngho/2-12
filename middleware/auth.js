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
    const authHeader = req.header('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const token = req.cookies?.accessToken || bearerToken;

    if (!token) return res.status(401).json({ error: '접근 권한이 없습니다. 로그인이 필요합니다.' });
    if (!process.env.JWT_SECRET) return res.status(500).json({ error: '서버 인증 설정 오류' });

    try {
        const decoded = verify(token, process.env.JWT_SECRET);
        // @ts-ignore
        req.user = decoded; // { id, role, name } 정보가 들어있음
        next(); // 다음 라우터로 통과!
    } catch (error) {
        res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    }
};

export default verifyToken;