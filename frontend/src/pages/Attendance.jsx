import { useState } from 'react';
// 더미데이터
const mockStudents = Array.from({ length: 29 }, (_, i) => i + 1)
  .filter(n => n !== 23)
  .map(num => ({
    id: num,
    status: num === 5 ? 'absent' : num === 12 ? 'media' : num === 18 ? 'activity' : null,
    remarks: num === 5 ? '몸이 아파서 병원 진료 후 귀가' : num === 18 ? '학생회 기획 회의 참석' : ''
  }));

export default function Attendance() {
  const [myStatus, setMyStatus] = useState(null); // null means unchecked
  const [myRemarks, setMyRemarks] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleStatusChange = (newStatus) => {
    // 이미 선택된 상태를 다시 누르면 끄기(체크 해제), 아니면 새 상태로 변경
    if (myStatus === newStatus) {
      setMyStatus(null);
      setMyRemarks('');
    } else {
      setMyStatus(newStatus);
      if (newStatus === 'media') {
        setMyRemarks(''); // 미디어스페이스는 비고 입력창이 필요없음
      }
    }
  };

  // '나'의 상태를 1번 학생에게 덮어씌워서 뷰에 반영 (임시 연동용)
  const displayStudents = mockStudents.map(st => {
    if (st.id === 1) {
      return { ...st, status: myStatus, remarks: myRemarks };
    }
    return st;
  });

  const getStatusColor = (st) => {
    if (st === 'absent') return 'bg-red-500 text-white border-red-500';
    if (st === 'media') return 'bg-blue-500 text-white border-blue-500';
    if (st === 'activity') return 'bg-green-500 text-white border-green-500';
    return 'bg-base-100 border-base-300 text-base-content';
  };

  const getStatusText = (st) => {
    if (st === 'absent') return '불참';
    if (st === 'media') return '미디어';
    if (st === 'activity') return '교내활동';
    return '출석';
  };

  return (
    <div className="flex-grow w-full max-w-5xl mx-auto flex flex-col pt-12 pb-16 items-center text-center space-y-12">

      {/* 나의 출결 설정 영역 */}
      <div className="w-full flex flex-col items-center">
        <h2 className="text-3xl font-bold mb-3">나의 야자 출결 현황</h2>
        <p className="opacity-60 text-base mb-10">오늘 나의 야간자율학습 참여 상태를 선택해주세요. (임시: 1번 학생에 반영)</p>

        <div className="flex flex-col sm:flex-row gap-6 w-full justify-center px-4">
          {/* 불참 (Red) */}
          <button
            onClick={() => handleStatusChange('absent')}
            className={`flex-1 max-w-[220px] aspect-square rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${myStatus === 'absent'
              ? 'border-red-500 bg-red-500 text-white scale-105 shadow-[0_10px_30px_rgba(239,68,68,0.3)]'
              : 'border-red-200 bg-transparent text-red-500 hover:border-red-300 hover:bg-red-50'
              }`}
          >
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            <span className="text-2xl font-bold tracking-wide">불참</span>
          </button>

          {/* 미디어 스페이스 (Blue) */}
          <button
            onClick={() => handleStatusChange('media')}
            className={`flex-1 max-w-[220px] aspect-square rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${myStatus === 'media'
              ? 'border-blue-500 bg-blue-500 text-white scale-105 shadow-[0_10px_30px_rgba(59,130,246,0.3)]'
              : 'border-blue-200 bg-transparent text-blue-500 hover:border-blue-300 hover:bg-blue-50'
              }`}
          >
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <span className="text-2xl font-bold tracking-wide">미디어스페이스</span>
          </button>

          {/* 교내활동 (Green) */}
          <button
            onClick={() => handleStatusChange('activity')}
            className={`flex-1 max-w-[220px] aspect-square rounded-3xl border-4 transition-all duration-300 flex flex-col items-center justify-center gap-4 ${myStatus === 'activity'
              ? 'border-green-500 bg-green-500 text-white scale-105 shadow-[0_10px_30px_rgba(34,197,94,0.3)]'
              : 'border-green-200 bg-transparent text-green-500 hover:border-green-300 hover:bg-green-50'
              }`}
          >
            <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            <span className="text-2xl font-bold tracking-wide">교내활동</span>
          </button>
        </div>

        {/* 비고 입력란 (불참 또는 교내활동 시 렌더링) */}
        {(myStatus === 'absent' || myStatus === 'activity') && (
          <div className="w-full max-w-xl mt-10 transition-all duration-300 transform translate-y-0 opacity-100">
            <div className="form-control w-full px-4">
              <label className="label">
                <span className="label-text font-bold text-neutral">
                  {myStatus === 'absent' ? '불참 사유 작성 (선택)' : '교내활동 및 동아리명 작성 (선택)'}
                </span>
              </label>
              <input
                type="text"
                placeholder={myStatus === 'absent' ? "예: 병원 진료, 학원, 기타 개인 사정" : "예: 학생회 기획회의, 생물 동아리 활동"}
                className="input input-bordered w-full border-2 focus:border-neutral focus:ring-0 transition-colors"
                value={myRemarks}
                onChange={(e) => setMyRemarks(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div className="w-full max-w-4xl border-t-2 border-base-200 opacity-60"></div>

      {/* 전체 출석 현황 그리드 */}
      <div className="w-full max-w-4xl px-4 flex flex-col items-center sm:items-start text-left">
        <div className="flex justify-between w-full items-end mb-6">
          <h3 className="text-2xl font-bold">전체 출석 현황</h3>
          <p className="text-sm opacity-60 hidden sm:block">아이콘이 있는 학생을 누르면 사유를 볼 수 있습니다.</p>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-4 w-full">
          {displayStudents.map(student => {
            const hasRemarks = (student.status === 'absent' || student.status === 'activity') && student.remarks;

            return (
              <div
                key={student.id}
                onClick={() => {
                  if (hasRemarks) {
                    setSelectedStudent(student);
                    document.getElementById('remarks_modal').showModal();
                  }
                }}
                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all duration-200 ${getStatusColor(student.status)
                  } ${hasRemarks ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg ring-2 ring-offset-2 ring-transparent hover:ring-opacity-50' : ''}
                ${hasRemarks && student.status === 'absent' ? 'hover:ring-red-400' : ''}
                ${hasRemarks && student.status === 'activity' ? 'hover:ring-green-400' : ''}`}
              >
                <span className="text-xl font-bold">{student.id}</span>
                <span className="text-sm font-semibold opacity-90 mt-1">{getStatusText(student.status)}</span>

                {/* 비고 존재 구슬 알림 */}
                {hasRemarks && (
                  <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-sm"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 확인용 비고 모달 (DaisyUI Modal) */}
      <dialog id="remarks_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${getStatusColor(selectedStudent?.status).split(' ')[0]}`}></span>
            {selectedStudent?.id}번 학생 비고 ({getStatusText(selectedStudent?.status)})
          </h3>
          <div className="bg-base-200 mt-4 p-5 rounded-lg text-lg min-h-[5rem] whitespace-pre-wrap flex items-center font-medium">
            {selectedStudent?.remarks}
          </div>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-neutral px-8 rounded-full">닫기</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>닫기</button>
        </form>
      </dialog>

    </div>
  );
}
