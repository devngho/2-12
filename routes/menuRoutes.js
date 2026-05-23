import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
	const { date } = req.query;

	if (!date) {
		return res.status(400).json({ error: "date 쿼리가 필요합니다." });
	}

	if (typeof date !== 'string') {
		return res.status(400).json({ error: "date는 문자열이어야 합니다." });
	}

	try {
		const response = await fetch(`https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${process.env.NEIS_KEY}&Type=json&ATPT_OFCDC_SC_CODE=N10&SD_SCHUL_CODE=8140270&MLSV_YMD=${date}`);
		const data = await response.json();
	
		if (data?.['mealServiceDietInfo']?.[1]?.row) {
			return res.status(200).json(data['mealServiceDietInfo'][1].row);
		}

		return res.status(404).json({ error: "급식 데이터를 찾을 수 없습니다." });
	} catch (error) {
		console.error(error);
		return res.status(500).json({ error: "급식 조회 오류" });
	}
});

export default router;
