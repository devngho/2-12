import { useState, useEffect } from 'react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('calendar_events');
    return saved ? JSON.parse(saved) : {};
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const [inputTitle, setInputTitle] = useState('');
  const [inputContent, setInputContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [detailEvent, setDetailEvent] = useState(null);

  useEffect(() => {
    localStorage.setItem('calendar_events', JSON.stringify(events));
  }, [events]);

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const getDatesForMonth = (year, month) => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const endDate = new Date(lastDayOfMonth);
    if (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    }

    const dates = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const currentDates = getDatesForMonth(currentDate.getFullYear(), currentDate.getMonth());

  const formatDateKey = (date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const openModal = (date) => {
    setSelectedDateKey(formatDateKey(date));
    setIsModalOpen(true);
    setInputTitle('');
    setInputContent('');
    setEditingId(null);
  };

  const closeModal = (e) => {
    if (e) e.stopPropagation();
    setIsModalOpen(false);
    setSelectedDateKey(null);
    setInputTitle('');
    setInputContent('');
    setEditingId(null);
  };

  const handleSaveEvent = (e) => {
    if (e) e.stopPropagation();
    if (!inputTitle.trim() || !selectedDateKey) return;

    setEvents(prev => {
      const dayEvents = prev[selectedDateKey] || [];
      if (editingId !== null) {
        return {
          ...prev,
          [selectedDateKey]: dayEvents.map(ev => ev.id === editingId ? { ...ev, title: inputTitle, content: inputContent } : ev)
        };
      } else {
        return {
          ...prev,
          [selectedDateKey]: [...dayEvents, { id: Date.now(), title: inputTitle, content: inputContent }]
        };
      }
    });

    setInputTitle('');
    setInputContent('');
    setEditingId(null);
  };

  const handleDeleteEvent = (id, e) => {
    if (e) e.stopPropagation();
    setEvents(prev => {
      const dayEvents = prev[selectedDateKey] || [];
      return {
        ...prev,
        [selectedDateKey]: dayEvents.filter(ev => ev.id !== id)
      };
    });
  };

  const handleEditEvent = (event, e) => {
    if (e) e.stopPropagation();
    setEditingId(event.id);
    setInputTitle(event.title || event.text || '');
    setInputContent(event.content || '');
  };

  return (
    <div className="flex-grow w-full max-w-4xl mx-auto flex flex-col pt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="select-none text-2xl font-bold">캘린더</h2>
        <div className="flex space-x-2">
          <button className="btn btn-sm btn-ghost" onClick={handlePrevMonth}>
            &lt;
          </button>
          <span className="font-semibold px-2 flex items-center">{currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월</span>
          <button className="btn btn-sm btn-ghost" onClick={handleNextMonth}>
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
            {currentDates.map((date, idx) => {
              const dateKey = formatDateKey(date);
              const dayEvents = events[dateKey] || [];
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();

              return (
                <div
                  key={idx}
                  onClick={() => openModal(date)}
                  className={`min-h-24 sm:min-h-28 flex flex-col p-1 border rounded-md cursor-pointer hover:bg-base-200 transition-colors ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <div className={`text-xs sm:text-sm font-medium ${date.getDay() === 0 ? 'text-error' : date.getDay() === 6 ? 'text-info' : ''}`}>
                      {date.getDate()}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="text-xs sm:text-sm font-medium text-gray-400">
                        {dayEvents.length}
                      </div>
                    )}
                  </div>
                  <div className="mt-1 flex flex-col gap-1 flex-1 overflow-hidden p-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); setDetailEvent({ ...event, dateKey }); }}
                        className="text-[10px] sm:text-xs bg-white text-black border border-gray-200 shadow-sm p-1 rounded truncate hover:bg-gray-50"
                      >
                        {event.title || event.text}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-sm">
            <h3 className="font-bold text-lg mb-4">{selectedDateKey} 일정 관리</h3>

            <div className="flex flex-col gap-2 mb-4 max-h-40 overflow-y-auto">
              {(events[selectedDateKey] || []).map(event => (
                <div key={event.id} className="flex justify-between items-center bg-base-200 p-2 rounded">
                  <span className="text-sm truncate w-3/5">{event.title || event.text}</span>
                  <div className="space-x-1 shrink-0 flex">
                    <button className="btn btn-xs btn-outline" onClick={(e) => handleEditEvent(event, e)}>수정</button>
                    <button className="btn btn-xs btn-error btn-outline" onClick={(e) => handleDeleteEvent(event.id, e)}>삭제</button>
                  </div>
                </div>
              ))}
              {(events[selectedDateKey] || []).length === 0 && (
                <p className="text-sm text-center text-gray-500 my-2">등록된 일정이 없습니다.</p>
              )}
            </div>

            <div className='mb-10' />

            <div className="form-control">
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="일정 제목 입력..."
                  className="input input-sm border border-base-300 w-full"
                  value={inputTitle}
                  onChange={e => setInputTitle(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEvent(e); }}
                />
                <textarea
                  placeholder="일정 내용 입력..."
                  className="textarea textarea-sm border border-base-300 w-full"
                  rows={3}
                  value={inputContent}
                  onChange={e => setInputContent(e.target.value)}
                />
                <button className="btn btn-neutral" onClick={handleSaveEvent}>
                  {editingId !== null ? '수정 사항 저장' : '새 일정 추가'}
                </button>
              </div>
            </div>

            <div className="modal-action mt-4">
              <button className="btn btn-sm" onClick={closeModal}>닫기</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={closeModal}>
            <button className="cursor-default border-none bg-transparent w-full h-full text-transparent">close</button>
          </div>
        </div>
      )}

      {detailEvent && (() => {
        const dayEvents = events[detailEvent.dateKey] || [];
        const currentIndex = dayEvents.findIndex(ev => ev.id === detailEvent.id);
        const hasNext = currentIndex !== -1 && currentIndex < dayEvents.length - 1;
        const hasPrev = currentIndex > 0;

        const goToNextEvent = () => {
          if (hasNext) {
            setDetailEvent({ ...dayEvents[currentIndex + 1], dateKey: detailEvent.dateKey });
          }
        };

        const goToPrevEvent = () => {
          if (hasPrev) {
            setDetailEvent({ ...dayEvents[currentIndex - 1], dateKey: detailEvent.dateKey });
          }
        };

        return (
          <div className="modal modal-open">
            <div className="modal-box w-11/12 max-w-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-lg truncate pr-2">{detailEvent.title || detailEvent.text}</h3>
                <div className="flex gap-1 shrink-0">
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={goToPrevEvent}
                    disabled={!hasPrev}
                  >
                    이전
                  </button>
                  <button
                    className="btn btn-ghost btn-xs"
                    onClick={goToNextEvent}
                    disabled={!hasNext}
                  >
                    다음
                  </button>
                </div>
              </div>
              <div className="bg-base-200 p-4 rounded-md min-h-[6rem] whitespace-pre-wrap text-sm">
                {detailEvent.content || '내용이 없습니다.'}
              </div>
              <div className="modal-action mt-4">
                <button className="btn btn-sm w-full" onClick={() => setDetailEvent(null)}>캘린더로 돌아가기</button>
              </div>
            </div>
            <div className="modal-backdrop" onClick={() => setDetailEvent(null)}>
              <button className="cursor-default border-none bg-transparent w-full h-full text-transparent">close</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
