import express from 'express';
const { Router } = express;

import CalendarEvent from '../models/CalendarEvent.js';
import verifyToken from '../middleware/auth.js';

const router = Router();

const PRIVILEGED_ROLES = ['관리자', '반장', '부반장', '선생님'];

/** @type{Record<string, any>} */
const cache = {};

// mostly overlap with school schedule
// /**
//  * @param {number} year
//  * @param {number} month
//  * 
//  * @return {Promise<{ title: string, date: number, content: string, source: string }[]>}
//  */
// async function getHolidays(year, month) {
//   const cacheKey = `${year}-${month}`;
//   if (cache[cacheKey]) {
//     return cache[cacheKey];
//   }

//   const res = await fetch(`https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?ServiceKey=${process.env.DATAGOKR_API_KEY}&solYear=${year}&solMonth=${month.toString().padStart(2, '0')}&_type=json`);
//   const data = await res.json();

//   if (Array.isArray(data?.['response']?.['body']?.['items']?.['item'])) {
//     const holidays = data['response']['body']['items']['item'].map((/** @type {{ dateKind: string, dateName: string, isHoliday: 'Y' | 'N', locdate: number, seq: number }} */ item) => ({
//       title: item.dateName, // parse yyyymmdd to date
//       date: Date.parse(`${item.locdate.toString().slice(0, 4)}-${item.locdate.toString().slice(4, 6)}-${item.locdate.toString().slice(6, 8)}`),
//       content: item.dateName,
//       source: 'holiday',
//       _id: `holiday-${item.locdate}`
//     })).filter(item => item.date && item.title);

//     cache[cacheKey] = holidays;
//     return holidays;
//   } else if (typeof data?.['response']?.['body']?.['items']?.['item'] === 'object') {
//     // single item case
//     const holiday = {
//       title: data['response']['body']['items']['item'].dateName,
//       date: Date.parse(`${data['response']['body']['items']['item'].locdate.toString().slice(0, 4)}-${data['response']['body']['items']['item'].locdate.toString().slice(4, 6)}-${data['response']['body']['items']['item'].locdate.toString().slice(6, 8)}`),
//       content: data['response']['body']['items']['item'].dateName,
//       source: 'holiday',
//       _id: `holiday-${data['response']['body']['items']['item'].locdate}`
//     };

//     cache[cacheKey] = [holiday];
//     return [holiday];
//   } else if (data?.['response']?.['body']?.['items'] === '') {
//     cache[cacheKey] = [];
//     return [];
//   } else {
//     console.error('공휴일 데이터를 가져오지 못했습니다:', JSON.stringify(data));
//     throw new Error("공휴일 데이터를 가져오지 못했습니다.");
//   }
// }

/**
 * @param {number} year
 * @param {number} month
 * @return {Promise<any>}
 */
async function getSchoolSchedule(year, month) {
  const response = await fetch(`https://open.neis.go.kr/hub/SchoolSchedule?KEY=${process.env.NEIS_KEY}&Type=json&ATPT_OFCDC_SC_CODE=N10&SD_SCHUL_CODE=8140270&AA_FROM_YMD=${year}${month.toString().padStart(2, '0')}01&AA_TO_YMD=${year}${month.toString().padStart(2, '0')}${new Date(year, month, 0).getDate()}`);
  const data = await response.json();

  if (Array.isArray(data?.['SchoolSchedule']?.[1]?.['row'])) {
    return data['SchoolSchedule'][1]['row'].map((/** @type {{ AA_YMD: string, EVENT_NM: string, SBTR_DD_SC_NM: string }} */ item) => ({
      title: item.EVENT_NM,
      date: Date.parse(`${item.AA_YMD.slice(0, 4)}-${item.AA_YMD.slice(4, 6)}-${item.AA_YMD.slice(6, 8)}`),
      content: `${item.EVENT_NM} (${item.SBTR_DD_SC_NM}) - 나이스 학사일정`,
      source: 'school',
      isHoliday: item.SBTR_DD_SC_NM === '공휴일' || item.SBTR_DD_SC_NM === '휴업일',
      _id: `school-${item.AA_YMD}-${item.EVENT_NM}`
    })).filter(item => item.date && item.title && item.title !== '토요휴업일');
  } else {
    console.error('학교 일정을 가져오지 못했습니다:', JSON.stringify(data));
    throw new Error("학교 일정을 가져오지 못했습니다.");
  }
}

// 특정 월의 일정 조회
router.get('/', verifyToken, async (req, res) => {
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: 'start, end 쿼리가 필요합니다.' });
  }

  // type check for start and end
  if (typeof start !== 'string' || typeof end !== 'string') {
    return res.status(400).json({ error: 'start, end는 문자열이어야 합니다.' });
  }

  // allow up to a year range, but not more
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (endDate < startDate || (endDate.getTime() - startDate.getTime()) > 365 * 24 * 60 * 60 * 1000) {
    return res.status(400).json({ error: '유효한 날짜 범위를 입력해주세요. (최대 1년)' });
  }

  try {
    const yearMonthSet = new Set();
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      yearMonthSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    }

    // const holidays = (async () => {
    //   const holidayPromises = Array.from(yearMonthSet).map(ym => {
    //     const [year, month] = ym.split('-').map(Number);
    //     return getHolidays(year, month);
    //   });

    //   return (await Promise.all(holidayPromises)).flat();
    // })();

    const schoolSchedule = (async () => {
      const schedulePromises = Array.from(yearMonthSet).map(ym => {
        const [year, month] = ym.split('-').map(Number);
        return getSchoolSchedule(year, month);
      });

      return (await Promise.all(schedulePromises)).flat();
    })();

    const events = CalendarEvent.find({
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1, createdAt: 1 });

    const [schoolScheduleResults, eventResults] = await Promise.allSettled([schoolSchedule, events]);

    const combinedEvents = [];
    const errorMessages = [];

    if (eventResults.status === 'fulfilled') {
      combinedEvents.push(...eventResults.value);
    } else {
      console.error('사용자 일정 로드 실패:', eventResults.reason);
      errorMessages.push('사용자 일정 로드 실패: ' + eventResults.reason.message);
    }

    if (schoolScheduleResults.status === 'fulfilled') {
      combinedEvents.push(...schoolScheduleResults.value);
    } else {
      console.error('학교 일정 로드 실패:', schoolScheduleResults.reason);
      errorMessages.push('학교 일정 로드 실패: ' + schoolScheduleResults.reason.message);
    }

    res.status(200).json({ events: combinedEvents, error: errorMessages.length > 0 ? errorMessages.join('; ') : undefined });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '일정 조회 오류' });
  }
});

// 수동 일정 추가 (반장/부반장/선생님만)
router.post('/', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
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
      date: new Date(date),
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
router.patch('/:id', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
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
    if (date) event.date = new Date(date);
    await event.save();
    res.json({ message: '일정이 수정되었습니다.', data: event });
  } catch (error) {
    res.status(500).json({ error: '일정 수정 오류' });
  }
});

// 일정 삭제 (수동 일정만, 반장/부반장/선생님만)
router.delete('/:id', verifyToken, /** @param {import('../auth.js').AuthenticatedRequest} req */ async (req, res) => {
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
