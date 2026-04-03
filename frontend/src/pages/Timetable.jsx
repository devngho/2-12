import { useState, useEffect } from 'react';
import api from '../services/api';
import { useRequireAuth } from '../contexts/AuthContext';

export default function Timetable() {
  const { isAuthed, ToastComponent } = useRequireAuth();

  const getTodayFormatted = () => new Date().toISOString().split('T')[0];

  const [date] = useState(getTodayFormatted());
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [selections, setSelections] = useState({
    '탐구A': '',
    '탐구B': '',
    '탐구C': ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('userSelects');
    if (saved) {
      setSelections(JSON.parse(saved));
    } else {
      setShowSetup(true);
    }
  }, []);

  const handleSaveSelections = () => {
    localStorage.setItem('userSelects', JSON.stringify(selections));
    setShowSetup(false);
  };

  useEffect(() => {
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

        const getRoom = (block, subject) => {
          if (!subject) return '';
          if (subject.includes('인공지능 기초')) return '컴퓨터실';
          if (subject.includes('생명과학')) return '2-5';
          if (subject.includes('물리')) {
            if (block === '탐구A' || block === '탐구B') return '2-7';
            if (block === '탐구C') return '2-4';
          }
          if (subject.includes('화학')) {
            if (block === '탐구A') return '2-5';
            if (block === '탐구B') return '2-3';
            if (block === '탐구C') return '2-12';
          }
          return '';
        };

        const newGrid = Array(7).fill(null).map(() => Array(5).fill({ name: '-' }));

        if (Array.isArray(data)) {
          data.forEach(item => {
            const ymd = item.date;
            const year = parseInt(ymd.slice(0, 4), 10);
            const month = parseInt(ymd.slice(4, 6), 10) - 1;
            const dayOfDate = parseInt(ymd.slice(6, 8), 10);
            const colIdx = new Date(year, month, dayOfDate).getDay() - 1;
            const rowIdx = parseInt(item.period) - 1;

            if (rowIdx >= 0 && rowIdx < 7 && colIdx >= 0 && colIdx < 5) {
              const baseName = item.name.replace(/\*/g, '').trim();
              const savedSubject = selections[baseName];

              const finalSubject = savedSubject || item.subject;
              const finalRoom = finalSubject ? getRoom(baseName, finalSubject) : item.room;

              newGrid[rowIdx][colIdx] = {
                name: baseName,
                subject: finalSubject,
                room: finalRoom,
                teacher: item.teacher
              };
            }
          });
        }
        setTimetable(newGrid);

      } catch (err) {
        console.error('시간표 정보를 불러오는데 실패했습니다:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (!showSetup) {
      fetchTimetable();
    }
  }, [selections, showSetup]);

  const subjectOptions = ['물리학', '화학', '생명과학', '지구과학', '인공지능 기초'];

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
        <div className="w-full max-w-md bg-base-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-2 border-base-200/50 rounded-3xl p-8 flex flex-col items-center">
          <h3 className="text-2xl font-bold mb-6">탐구 과목 설정</h3>
          <p className="text-base-content/70 mb-8 text-sm">개인의 이동수업 시간표를 확인하기 위해<br />각 블록별로 수강하는 과목을 선택해주세요.</p>

          <div className="w-full space-y-4">
            {['탐구A', '탐구B', '탐구C'].map(block => (
              <div key={block} className="form-control w-full">
                <label className="label">
                  <span className="label-text font-bold text-base">{block}</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selections[block]}
                  onChange={(e) => setSelections({ ...selections, [block]: e.target.value })}
                >
                  <option value="" disabled>과목을 선택하세요</option>
                  {subjectOptions.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <button
            className="btn btn-neutral w-full mt-8 rounded-xl font-bold text-lg" // Neutral dark button, consistent with minimal design
            onClick={handleSaveSelections}
            disabled={!selections['탐구A'] || !selections['탐구B'] || !selections['탐구C']}
          >
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
                      <td className="py-4 font-bold text-lg text-neutral/50 bg-base-100/30 border-r border-base-200/30">
                        {rowIdx + 1}
                      </td>
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="py-4 font-bold text-[17px] tracking-tight bg-white border-r last:border-r-0 border-base-200/30 relative">
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
