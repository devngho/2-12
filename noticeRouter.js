// noticeRouter.js
const express = require('express');
const router = express.Router();

// 임시 데이터 (나중에 친구가 DB로 연결하기 쉽게 배열로 관리)
let notices = [];

// [기능 1] 공지사항 등록 (선생님, 반장, 부반장, 1인1역 전용)
router.post('/', (req, res) => {
  const { category, content, deadline, dDayAlarm, role } = req.body;
  
  // 권한 체크: 허용된 역할만 등록 가능
  const allowedRoles = ['teacher', 'leader', 'subleader', 'manager'];
  if (!allowedRoles.includes(role)) {
    return res.status(403).json({ error: "공지를 등록할 권한이 없습니다." });
  }

  const newNotice = {
    id: notices.length + 1,
    category, // performance(수행), supplies(준비물), event(이벤트)
    content,
    deadline: new Date(deadline),
    dDayAlarm: dDayAlarm || 3,
    createdAt: new Date()
  };
  
  notices.push(newNotice);
  res.status(201).json({ message: "공지가 등록되었습니다.", data: newNotice });
});

// [기능 2] 전체 공지 조회 (분야별 필터링은 프론트에서 처리하거나 쿼리로 처리)
router.get('/', (req, res) => {
  res.json(notices);
});

// [기능 3] 알림창 전용 데이터 (D-Day 임박한 수행평가만 추출)
router.get('/alerts', (req, res) => {
  const today = new Date();
  const alerts = notices.filter(n => {
    if (n.category === 'performance') {
      const diffTime = n.deadline - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= n.dDayAlarm && diffDays >= 0;
    }
    return false;
  });
  res.json(alerts);
});

// [기능 4] 비밀번호 변경 (반장, 부반장 전용) - 친구의 User 데이터에 접근하는 방식 제안
router.patch('/change-pw', (req, res) => {
  const { requesterRole, targetId, newPassword } = req.body;
  
  if (requesterRole !== 'leader' && requesterRole !== 'subleader') {
    return res.status(403).json({ error: "비밀번호 수정 권한이 없습니다." });
  }
  
  // 이 부분은 친구가 만든 'users' 배열이나 DB에 연결해야 하므로 메시지만 반환
  res.json({ message: `${targetId}의 비밀번호를 ${newPassword}로 변경 요청함(DB연결필요)` });
});

module.exports = router;