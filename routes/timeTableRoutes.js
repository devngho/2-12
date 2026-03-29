import { Router } from 'express';
import mongoose from 'mongoose';
import verifyToken from '../middleware/auth.js';
import TimeTable from '../models/TimeTable.js';
import pkg from 'jsonwebtoken';

const { verify } = pkg;
const router = Router();

/** @type {Record<string, any>} */
const cache = {}


//comment: NEIS API에서 아예 탐구 A, 탐구 B 이런식으로 불러오더라고.. 참고하세요
const mappings = { // todo: find more concise way
    '인공지능 기초': '탐구A',
    '정치': '탐구B',
    '물리학': '탐구C'
}

/**
 * @param {string} startDate
 * @param {string} endDate
 */
async function getGlobalTimetable(startDate, endDate) {
    const cacheKey = `${startDate}_${endDate}`;
    if (cache[cacheKey]) {
        return cache[cacheKey];
    }
    const neisKey = process.env.NEIS_KEY || process.env.VITE_NEIS_API_KEY;
    const keyParam = neisKey ? `&KEY=${neisKey}` : '';
    const res = await fetch(`https://open.neis.go.kr/hub/hisTimetable?Type=json&pSize=100&ATPT_OFCDC_SC_CODE=N10&SD_SCHUL_CODE=8140270&GRADE=2&CLASS_NM=12&TI_FROM_YMD=${startDate}&TI_TO_YMD=${endDate}${keyParam}`);
    const data = await res.json();

    if (data?.['hisTimetable']?.[1]?.row) {
        const timetable = data['hisTimetable'][1].row.map((/** @type {{ ITRT_CNTNT: string, PERIO: string, ALL_TI_YMD: string }} */ item) => ({
            name: Object.entries(mappings).find(([key, value]) => item.ITRT_CNTNT === key)?.[1] || item.ITRT_CNTNT,
            period: item.PERIO,
            date: item.ALL_TI_YMD,
        }));

        cache[cacheKey] = timetable;
        return timetable;
    } else {
        throw new Error("시간표 데이터를 가져오지 못했습니다.");
    }
}


// comment: 우선 생성형 AI가 이렇게 만들었는데, 선택한 선택과목 DB에 전송하는 과정 필요함.
// 학생 번호별 탐구 과목 및 선택 과목 하드코딩 데이터
// 프론트엔드에서 수동으로 선택할 필요 없이, 학번(userId)에 따라 여기서 바로 과목을 내려줍니다.
const COMBINATIONS = [
    {
        subjects: { '탐구A': '물리학', '탐구B': '화학', '탐구C': '생명과학' },
        students: ['1', '5', '12', '24'] // 이 조합을 수강하는 학생 번호 목록
    },
    {
        subjects: { '탐구A': '인공지능 기초', '탐구B': '정치', '탐구C': '윤리와 사상' },
        students: ['2', '3', '7', '18']
    }
    // 추가 조합을 아래에 작성하세요.
];

router.get('/', async (req, res) => {
    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: "startDate와 endDate 쿼리가 필요합니다." });
    }

    if (typeof start !== 'string' || typeof end !== 'string') {
        return res.status(400).json({ error: "startDate와 endDate는 문자열이어야 합니다." });
    }

    // Optional auth validation (do not explicitly block missing tokens)
    let userId = null;
    const authHeader = req.header('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const token = req.cookies?.accessToken || bearerToken;

    if (token && process.env.JWT_SECRET) {
        try {
            const decoded = verify(token, process.env.JWT_SECRET);
            // @ts-ignore
            userId = decoded.id; // 로그인 시 사용된 studentId (예: '1', '21201' 등)
        } catch (e) { }
    }

    try {
        const timetable = await getGlobalTimetable(start, end);
        let userMappings = null;

        // 1순위: COMBINATIONS 배열에서 학번이 속한 탐구 조합 찾기
        let predefined = null;
        if (userId) {
            const matchedCombo = COMBINATIONS.find(combo => combo.students.includes(String(userId)));
            if (matchedCombo) {
                predefined = matchedCombo.subjects;
            }
        }

        if (predefined) {
            // DB 형식(selects 배열)으로 맞춰 변환하여 넘김 (JS 객체 생성)
            userMappings = {
                selects: Object.entries(predefined).map(([name, subject]) => ({ name, subject, room: '', teacher: '' }))
            };
        }
        // 2순위: 사전에 데이터가 없다면 기존처럼 DB 조회 의존 (선택사항)
        else if (userId) {
            const isDbConnected = mongoose.connection.readyState === 1;
            if (isDbConnected) {
                userMappings = await TimeTable.findOne({ studentId: userId });
            }
        }

        if (userMappings) {
            const personalizedTimetable = timetable.map((/** @type {{ name: string; }} */ item) => {
                const userSelect = userMappings.selects.find(select => select.name === item.name);
                return {
                    ...item,
                    subject: userSelect?.subject || null,
                    teacher: userSelect?.teacher || null,
                    room: userSelect?.room || null
                };
            });
            res.status(200).json(personalizedTimetable);
        } else {
            res.status(200).json(timetable);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "시간표 조회 오류" });
    }
});

router.post('/select', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "인증이 필요합니다." });

    const { selections } = req.body;

    if (!Array.isArray(selections)) {
        return res.status(400).json({ error: "selections는 배열이어야 합니다." });
    }

    try {
        let timeTable = await TimeTable.findOne({ studentId: req.user.id });

        if (!timeTable) {
            timeTable = new TimeTable({
                studentId: req.user.id,
                selects: selections.map((/** @type {{ name: string; subject: string; teacher: string; room: string }} */ sel) => ({
                    name: sel.name,
                    subject: sel.subject,
                    teacher: sel.teacher,
                    room: sel.room
                }))
            });
        } else {
            // update
            // @ts-ignore
            timeTable.selects = [...timeTable.selects.filter(select => !selections.some(sel => sel.name === select.name)), ...selections.map((/** @type {{ name: string; subject: string; teacher: string; room: string }} */ sel) => ({
                name: sel.name,
                subject: sel.subject,
                teacher: sel.teacher,
                room: sel.room
            }))];
        }

        await timeTable.save();
        res.status(200).json({ message: "선택이 저장되었습니다." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "선택 저장 오류" });
    }
});

export default router;
