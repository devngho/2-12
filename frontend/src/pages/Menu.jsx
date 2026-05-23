import { useState, useEffect } from 'react';
import api from '../services/api';

const mealName = {
  '조식': '아침',
  '중식': '점심',
  '석식': '저녁',
}

export default function Menu() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      setError(false);
      try {
        const formattedDate = date.replace(/-/g, ''); // 2023-11-01 -> 20231101
        const { data } = await api.get('/menu', { params: { date: formattedDate } });

        if (data?.length > 0) {
          console.log('급식 정보:', data);
          setMeals(data);
        } else {
          setMeals([]); // 급식이 없는 날
        }
      } catch (err) {
        console.error('급식 정보 패치 에러:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchMeals();
  }, [date]);

  // 메뉴 텍스트 정리 (<br/> 제거 및 알레르기 수치 등 괄호 제거)
  const formatMenuText = (text) => {
    return text.split('<br/>').map((item, idx) => {
      // "식단명 (1.2.3.4)" 형태에서 괄호 안의 알레르기 부분 제거, "*" 등 제거
      const cleanName = item.replace(/\([0-9.\s]+\)|[*]/g, '').trim();
      return <div key={idx} className="py-1 border-b last:border-0 border-base-200 dark:border-base-100 ">{cleanName}</div>;
    });
  };

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto flex flex-col pt-12 items-center text-center space-y-12">
      <div>
        <h2 className="text-3xl font-bold mb-3">학교 급식표</h2>
        <p className="opacity-60 text-base">선택한 날짜의 북일고등학교 식단 정보를 확인하세요.</p>
      </div>

      <div className="w-full max-w-sm px-4">
        <input 
          type="date" 
          className="input input-lg input-bordered w-full rounded-2xl border-2 text-center font-bold text-lg" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />
      </div>

      <div className="px-4 w-full justify-center pb-8 flex flex-col md:flex-row gap-6">
        {loading ? (
          <div className="py-20 flex w-full justify-center">
            <span className="loading loading-spinner loading-lg text-neutral"></span>
          </div>
        ) : error ? (
          <div className="py-20 text-red-500 w-full text-center">급식 정보를 불러오는데 실패했습니다.</div>
        ) : meals.length === 0 ? (
          <div className="py-20 text-base-content w-full text-center text-lg bg-base-100 rounded-3xl border-2">해당 날짜의 급식 정보가 없습니다. (휴일/주말 등)</div>
        ) : (
          meals.map((meal, index) => (
            <div key={index} className="flex-1 card bg-base-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border-2 border-base-200 rounded-3xl overflow-hidden hover:border-neutral transition-colors">
              <div className="py-4 border-b-2 border-base-200 bg-base-200">
                <h3 className="text-xl font-bold tracking-wide">
                  {mealName[meal.MMEAL_SC_NM] ?? meal.MMEAL_SC_NM}
                </h3>
                <p className="text-sm opacity-60 mt-1">{meal.CAL_INFO}</p>
              </div>
              <div className="card-body p-6 text-base font-medium leading-relaxed bg-white dark:bg-base-200">
                {formatMenuText(meal.DDISH_NM)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
