import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import TimeTable from '../models/TimeTable.js';

const router = Router();

/** @type {Record<string, any>} */
const cache = {}

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

    const res = await fetch(`https://open.neis.go.kr/hub/hisTimetable?KEY=${process.env.NEIS_KEY}&Type=json&ATPT_OFCDC_SC_CODE=N10&SD_SCHUL_CODE=8140270&GRADE=2&CLASS_NM=12&TI_FROM_YMD=${startDate}&TI_TO_YMD=${endDate}`);
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

router.get('/', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "인증이 필요합니다." });

    const { start, end } = req.query;

    if (!start || !end) {
        return res.status(400).json({ error: "startDate와 endDate 쿼리가 필요합니다." });
    }

    if (typeof start !== 'string' || typeof end !== 'string') {
        return res.status(400).json({ error: "startDate와 endDate는 문자열이어야 합니다." });
    }

    try {
        const timetable = await getGlobalTimetable(start, end);
        const userMappings = await TimeTable.findOne({ studentId: req.user.id });

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

            res.status(200).json({
                timetable: personalizedTimetable,
                selections: userMappings.selects.reduce((acc, sel) => ({ ...acc, [sel.name]: {
                    subject: sel.subject,
                    teacher: sel.teacher,
                    room: sel.room
                } }), {})
            });
        } else {
            res.status(200).json({timetable, selections: {}});
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