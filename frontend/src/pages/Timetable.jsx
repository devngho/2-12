import { useState, useEffect, useEffectEvent, useCallback } from 'react';
import api from '../services/api';
import { useRequireAuth } from '../contexts/AuthContext';

export default function Timetable() {
  const { isAuthed, ToastComponent } = useRequireAuth();

  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [serverSelections, setServerSelections] = useState({});
  const [selections, setSelections] = useState({
    '탐구A': null,
    '탐구B': null,
    '탐구C': null
  });

  useEffect(() => {
    if (timetable.length == 0 || (serverSelections['탐구A'] && serverSelections['탐구B'] && serverSelections['탐구C'])) {
      setShowSetup(false);
    } else {
      setShowSetup(true);
    }
  }, [serverSelections, timetable]);

  const fetchTimetable = async () => {
    setLoading(true);
    setError(false);
    try {
      const d = new Date();
      const day = d.getDay();
      const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d);
      monday.setDate(diffToMonday);
      const friday = new Date(d);
      friday.setDate(diffToMonday + 4);

      const format = dt => dt.getFullYear() + String(dt.getMonth() + 1).padStart(2, '0') + String(dt.getDate()).padStart(2, '0');
      const startDate = format(monday);
      const endDate = format(friday);

      const response = await api.get(`/timetable`, { params: { start: startDate, end: endDate } });
      const data = response.data;

      const newGrid = Array(7).fill(null).map(() => Array(5).fill({ name: '-' }));

      if (Array.isArray(data?.timetable)) {
        data.timetable.forEach(item => {
          const ymd = item.date;
          const year = parseInt(ymd.slice(0, 4), 10);
          const month = parseInt(ymd.slice(4, 6), 10) - 1;
          const dayOfDate = parseInt(ymd.slice(6, 8), 10);
          const colIdx = new Date(year, month, dayOfDate).getDay() - 1;
          const rowIdx = parseInt(item.period) - 1;

          if (rowIdx >= 0 && rowIdx < 7 && colIdx >= 0 && colIdx < 5) {
            const baseName = item.name.replace(/\*/g, '').trim();

            newGrid[rowIdx][colIdx] = {
              name: baseName,
              subject: item.subject ?? null,
              room: item.room ?? null,
              teacher: item.teacher ?? null
            };
          }
        });

        if (data?.selections) {
          setServerSelections(prev => ({ ...prev, ...data.selections }));
          setSelections(prev => ({ ...prev, ...data.selections }));
        }
      }
      setTimetable(newGrid);

    } catch (err) {
      console.error('시간표 정보를 불러오는데 실패했습니다:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!showSetup) {
      fetchTimetable();
    }
  }, [showSetup]);

  const handleSaveSelections = (async () => {
    try {
      setLoading(true);
      await api.post('/timetable/select', { selections: Object.entries(selections).map(([name, subject]) => ({ name, ...subject })) });
      setShowSetup(false);
    } catch (err) {
      console.error('선택한 과목을 저장하는데 실패했습니다:', err);
    } finally {
      // 시간표를 다시 불러와서 업데이트
      setTimetable([]);
      setError(false);
      setLoading(true);
    }
  });

  // const subjectOptions = ['물리학', '화학', '생명과학', '지구과학', '인공지능 기초'];
  const subjectOptions = {
    '탐구A': {
      '물리학': { teacher: '이선경', room: '207' },
      '인공지능 기초': { teacher: '최다솜', room: '컴퓨터실2' },
      '화학': { teacher: '하희연', room: '203' },
    },
    '탐구B': {
      '물리학': { teacher: '이선경', room: '207' },
      '인공지능 기초': { teacher: '최다솜', room: '컴퓨터실2' },
      '화학': { teacher: '하희연', room: '203' },
    },
    '탐구C': {
      '물리학': { teacher: '이선경', room: '204' },
      '생명과학': { teacher: '박완수', room: '205' },
      '화학': { teacher: '석영광', room: '212' },
    }
  }

  if (!isAuthed) {
    return (
      <div className="flex-grow flex items-center justify-center">
        {ToastComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="flex-grow w-full max-w-5xl mx-auto flex flex-col pt-12 items-center text-center space-y-12">
      <div>
        <h2 className="text-3xl font-bold mb-3">주간 시간표</h2>
        <p className="opacity-60 text-base">2학년 12반의 1학기 요일별 시간표입니다.</p>
      </div>

      {showSetup ? (
        <div className="w-full max-w-md bg-base-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-2 border-base-200 dark:border-base-100 rounded-3xl p-8 flex flex-col items-center">
          <h3 className="text-2xl font-bold mb-6">탐구 과목 설정</h3>
          <p className="text-base-content/70 mb-8 text-sm">개인의 이동수업 시간표를 확인하기 위해<br />각 블록별로 수강하는 과목을 선택해주세요.</p>

          <div className="w-full space-y-4">
            {Object.keys(subjectOptions).map(block => (
              <div key={block} className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-base">{block}</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selections[block]?.subject || ''}
                  onChange={(e) => setSelections({ ...selections, [block]: { subject: e.target.value, ...(subjectOptions[block]?.[e.target.value] ?? {}) } })}
                >
                  <option value="" disabled selected>과목을 선택하세요</option>
                  {Object.entries(subjectOptions[block] || {}).map(([sub, { teacher, room }]) => (
                    <option key={sub} value={sub}>{sub} ({teacher} 선생님, {room})</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            className="btn btn-neutral w-full mt-8 rounded-xl font-bold text-lg" // Neutral dark button, consistent with minimal design
            onClick={handleSaveSelections}
            disabled={!selections['탐구A'] || !selections['탐구B'] || !selections['탐구C'] || loading}
          >
            {loading ? <span className="loading loading-spinner loading-lg text-neutral"></span> : null}
            설정 완료 및 시간표 보기
          </button>
        </div>
      ) : (
        <div className="w-full px-4 flex justify-center pb-8 overflow-x-auto flex-col items-center space-y-6">
          <div className="w-full max-w-4xl bg-base-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-2 border-base-200/50 rounded-3xl overflow-hidden min-w-[600px] flex flex-col relative">
            <table className="table w-full text-center">
              <thead>
                <tr className="bg-base-200 border-b-2 border-base-200/50">
                  <th className="py-4 text-base font-bold text-base-content/80 border-r border-base-200/30 w-[10%]">교시</th>
                  <th className="py-4 text-base font-bold text-base-content/80 w-[18%]">월</th>
                  <th className="py-4 text-base font-bold text-base-content/80 w-[18%]">화</th>
                  <th className="py-4 text-base font-bold text-base-content/80 w-[18%]">수</th>
                  <th className="py-4 text-base font-bold text-base-content/80 w-[18%]">목</th>
                  <th className="py-4 text-base font-bold text-base-content/80 w-[18%]">금</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-center relative">
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-base-100/50 backdrop-blur-sm">
                        <span className="loading loading-spinner loading-lg text-neutral"></span>
                      </div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-red-500">시간표 데이터를 불러오지 못했습니다.</td>
                  </tr>
                ) : timetable.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-20 text-base-content/50 text-lg">해당 주의 시간표 데이터가 없습니다.</td>
                  </tr>
                ) : (
                  timetable.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-base-50 transition-colors border-b last:border-b-0 border-base-200/30">
                      <td className="py-4 font-bold text-lg text-neutral/50 dark:text-white/50 bg-base-100/30 border-r border-base-200/30">
                        {rowIdx + 1}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="py-4 font-bold text-[17px] tracking-tight bg-white dark:bg-base-200 border-r last:border-r-0 border-base-200 dark:border-base-100 relative">
                          {cell.subject ? (
                            <div className="flex flex-col items-center">
                              <span className="text-blue-600 mb-1">{cell.subject}</span>
                              <div className="text-xs text-base-content/60 flex items-center justify-center gap-1 font-medium bg-base-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                                <span>{cell.name}</span>
                                {cell.room && <><span>|</span><span>{cell.room}</span></>}
                              </div>
                            </div>
                          ) : (
                            <span>{cell.name}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <button onClick={() => setShowSetup(true)} className="btn btn-sm btn-outline btn-neutral mt-2">과목 재설정</button>
        </div>
      )}
    </div>
  );
}
