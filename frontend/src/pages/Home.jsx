import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo2 from '../assets/logo2.svg';

const menuItems = [
  { name: '공지사항', path: '/notice/class' },
  { name: '커뮤니티', path: '/board/community' },
  { name: '급식표', path: '/menu' },
  { name: '시간표', path: '/timetable' },
  { name: '출결 확인', path: '/attend' },
  { name: '번호 뽑기', path: '/numberpicker' },
  { name: '학사일정', path: '/calendar' },
];

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function getDonutSlicePath(cx, cy, ir, or, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, or, startAngle);
  const end = polarToCartesian(cx, cy, or, endAngle);
  const innerStart = polarToCartesian(cx, cy, ir, startAngle);
  const innerEnd = polarToCartesian(cx, cy, ir, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", start.x, start.y,
    "A", or, or, 0, largeArcFlag, 1, end.x, end.y,
    "L", innerEnd.x, innerEnd.y,
    "A", ir, ir, 0, largeArcFlag, 0, innerStart.x, innerStart.y,
    "Z"
  ].join(" ");
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const startTime = Date.now();
    let animationFrameId;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      // 1초에 2도씩 시계 반대 방향(-) 회전
      setRotation((elapsed * -2 / 1000) % 360);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // 전체 크기를 줄이고, 상하스크롤을 제거하기 위해 스케일 축소
  const SVG_SIZE = 560;
  const cx = SVG_SIZE / 2;
  const cy = SVG_SIZE / 2;
  const innerRadius = 150;
  const outerRadius = 270;
  // 7개로 360도를 정확히 등분 (약 51.4도)
  const sliceAngle = 360 / menuItems.length;
  // 바늘 모양 틈을 없애기 위해 각도 틈을 0으로 설정
  const gapAngle = 0;

  return (
    <div className="flex-grow flex flex-col items-center pt-8 pb-2 relative overflow-hidden bg-white w-full border-t border-transparent">
      <div
        className="relative z-10 flex items-center justify-center rounded-full"
        style={{ width: `${SVG_SIZE}px`, height: `${SVG_SIZE}px`, maxWidth: '100vw' }}
      >
        {/* 중앙 로고 */}
        <div
          className="z-30 transition-transform duration-200 ease-out relative cursor-pointer"
          style={{ transform: isOpen ? 'scale(1.15)' : 'scale(1)' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {/* 스케일 다운: w-80 -> w-64 변경하여 여백 확보 */}
          <img src={logo2} alt="Bugil212 Logo" className="w-64 h-auto drop-shadow-sm pointer-events-none" />
        </div>

        {/* SVG 방사형 부채꼴 메뉴 */}
        <div
          className="absolute inset-0 z-20 pointer-events-none"
        >
          <svg width="100%" height="100%" viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}>
            <g>
              {menuItems.map((item, index) => {
                const startAngle = index * sliceAngle + rotation;
                const endAngle = (index + 1) * sliceAngle + rotation;
                const pathD = getDonutSlicePath(cx, cy, innerRadius, outerRadius, startAngle, endAngle);

                const midAngle = startAngle + (endAngle - startAngle) / 2;
                const textRadius = (innerRadius + outerRadius) / 2;
                const textPos = polarToCartesian(cx, cy, textRadius, midAngle);

                const ccwIndex = index === 0 ? 0 : menuItems.length - index;
                const delay = ccwIndex * 40; // 40ms 간격으로 반시계 방향 순서

                return (
                  <g
                    key={index}
                    className={`group cursor-pointer ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
                    onClick={() => navigate(item.path)}
                    style={{
                      transformOrigin: `${cx}px ${cy}px`,
                      transform: isOpen ? 'scale(1)' : 'scale(0.5)',
                      opacity: isOpen ? 1 : 0,
                      transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                    }}
                  >
                    {/* 선의 두께를 사용하여 평행하고 일정한 틈을 만듦 */}
                    <path
                      d={pathD}
                      className="fill-black transition-colors duration-200 group-hover:fill-white"
                      style={{ stroke: '#ffffff', strokeWidth: '5px' }}
                    />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      textAnchor="middle"
                      dy="0.33em"
                      className="fill-white font-semibold text-lg transition-colors duration-200 group-hover:fill-black select-none pointer-events-none"
                    >
                      {item.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
