import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import logo1 from '../../assets/logo1.svg';

const menuItems = [
  { name: '공지사항', path: '/notice/class' },
  { name: '커뮤니티', path: '/board/community' },
  { name: '급식표', path: '/menu' },
  { name: '시간표', path: '/timetable' },
  { name: '출결 확인', path: '/attend' },
  { name: '번호 뽑기', path: '/numberpicker' },
  { name: '학사일정', path: '/calendar' },
];

export default function FloatingMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  // 메뉴 밖을 클릭하면 자동으로 닫히도록 설정
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 메인 페이지 및 인증 페이지에서는 렌더링하지 않음
  const excludedPaths = ['/', '/login', '/register', '/login-success', '/register-success'];
  if (excludedPaths.includes(location.pathname)) return null;

  // 현재 방문 중인 페이지를 제외한 나머지 화면들만 필터링
  const validItems = menuItems.filter(item => item.path !== location.pathname);

  // 항목이 밑에서부터 쌓여서 올라가도록 배열 순서를 뒤집어 렌더링 준비
  return (
    <div ref={menuRef} className="fixed bottom-8 right-8 z-[100] flex flex-col items-center xl:right-12 xl:bottom-12">
      {/* 팝업 메뉴 리스트 */}
      <div className="flex flex-col-reverse mb-4 gap-3 items-center pointer-events-none">
        {validItems.reverse().map((item, idx) => (
          <div
            key={item.path}
            className={`transition-all duration-300 origin-bottom ${isOpen ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
              }`}
            style={{
              transitionDelay: isOpen ? `${idx * 40}ms` : `${(validItems.length - 1 - idx) * 30}ms`
            }}
          >
            <button
              onClick={() => {
                navigate(item.path);
                setIsOpen(false);
              }}
              className="w-36 py-2.5 px-4 rounded-full bg-black text-white hover:bg-white hover:text-black border-2 border-black hover:border-black font-bold shadow-lg transition-colors duration-75 text-[15px] flex items-center justify-center tracking-wide cursor-pointer"
            >
              {item.name}
            </button>
          </div>
        ))}
      </div>

      {/* 플로팅 메인 버튼 (로고) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-36 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-transform z-10 cursor-pointer"
      >
        <img src={logo1} alt="Menu" className="w-12 h-12 object-contain" />
      </button>
    </div>
  );
}
