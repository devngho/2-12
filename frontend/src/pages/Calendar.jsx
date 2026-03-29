import { useState } from 'react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  
  // Very simplified mock calendar grid
  const mockDates = Array.from({length: 35}, (_, i) => {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    d.setDate(d.getDate() - d.getDay() + i);
    return d;
  });

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto flex flex-col pt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">학사 및 수행평가 일정</h2>
        <div className="flex space-x-2">
           <button className="btn btn-sm btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>
             &lt;
           </button>
           <span className="font-semibold px-2 flex items-center">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</span>
           <button className="btn btn-sm btn-ghost" onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>
             &gt;
           </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-2 sm:p-4">
          <div className="grid grid-cols-7 mb-2 text-center font-bold text-sm">
            {days.map(day => <div key={day} className={day === '일' ? 'text-error' : day === '토' ? 'text-info' : ''}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1 sm:gap-2 auto-rows-fr">
            {mockDates.map((date, idx) => (
              <div key={idx} className={`min-h-20 sm:min-h-24 p-1 border rounded-md ${date.getMonth() !== currentDate.getMonth() ? 'opacity-30' : ''}`}>
                <div className={`text-xs sm:text-sm font-medium ${date.getDay() === 0 ? 'text-error' : date.getDay() === 6 ? 'text-info' : ''}`}>
                  {date.getDate()}
                </div>
                {/* Mock Event */}
                {date.getDate() % 12 === 0 && date.getMonth() === currentDate.getMonth() && (
                  <div className="mt-1 text-[10px] sm:text-xs bg-neutral text-neutral-content p-1 rounded truncate">
                    수행평가
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
