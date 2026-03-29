import { useState, useEffect, useRef } from 'react';
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

const ParticleSystem = ({ isOpen }) => {
  const canvasRef = useRef(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Scale for high dpi displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x to save performance
    let width = 0;
    let height = 0;

    let targetCoords = [];
    let particles = [];

    const calculateTextCoords = () => {
      // 페이지 안쪽 박스를 벗어나 화면 찐 전체 크기로 (Fixed Canvas)
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';

      const offCanvas = document.createElement('canvas');
      offCanvas.width = width;
      offCanvas.height = height;
      const oCtx = offCanvas.getContext('2d');
      if (!oCtx) return;

      oCtx.fillStyle = 'white';
      // 폰트를 압도적으로 키워 꽉 찬 예술적인 연출을 돕습니다.
      // 폰트가 지나치게 커지면 뚫고 나갈 수 있으므로 화면 너비의 최대 38% 수준으로 제한합니다.
      const fontSize = Math.min(width * 0.38, 700);
      oCtx.font = `900 ${fontSize}px "Inter", "Arial", sans-serif`;
      oCtx.textBaseline = 'middle';

      // 서로 약 5% 더 떨어트림 (25% -> 20%, 75% -> 80%)
      oCtx.textAlign = 'center';
      const leftBoundary = width * 0.18;
      const rightBoundary = width * 0.82;

      // 한글 폰트는 'middle' 적용 시 윗공간이 더 넓어 시각적으로 위로 떠 보이는 현상이 있어, 
      // y좌표에 미세한 보정값을 더해 완벽한 세로 정중앙(시각적)에 안착시킵니다.
      const visualCenterY = height / 2 + fontSize * 0.06;

      oCtx.fillText('ㅎ', leftBoundary, visualCenterY);
      oCtx.fillText('ㅇ', rightBoundary, visualCenterY);

      const imgData = oCtx.getImageData(0, 0, width, height).data;
      const coords = [];
      const density = Math.max(3, Math.floor(width / 350));

      for (let y = 0; y < height; y += density) {
        for (let x = 0; x < width; x += density) {
          const idx = (y * width + x) * 4;
          if (imgData[idx + 3] > 128) {
            coords.push({ x, y });
          }
        }
      }

      // 글자 형태를 고르게 유지하기 위해 전체 픽셀에서 무작위 추출
      for (let i = coords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [coords[i], coords[j]] = [coords[j], coords[i]];
      }

      // 글자로 뭉치는 입자 수 약간 감축 (480개) - 더 가볍고 미니멀해짐
      targetCoords = coords.slice(0, 1000);
      // X 좌표 기준으로 정렬 (왼쪽 입자는 'ㅎ', 오른쪽 입자는 'ㅇ'으로 가장 짧은 동선을 그림)
      targetCoords.sort((a, b) => a.x - b.x);

      // 전체 배경을 채울 기본 별가루(백그라운드) 입자 수는 대폭 늘려서 (1000개) 우주처럼 풍성하게 만듦
      const totalParticles = targetCoords.length + 2000;

      // 전체 화면에 900개 홈(지정석) 그리드 점 생성
      const homes = [];
      const aspect = width / height;
      const cols = Math.floor(Math.sqrt(totalParticles * aspect));
      const rows = Math.ceil(totalParticles / cols);
      const cellW = width / cols;
      const cellH = height / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const jx = (Math.random() - 0.5) * cellW * 0.8;
          const jy = (Math.random() - 0.5) * cellH * 0.8;
          homes.push({
            x: c * cellW + cellW / 2 + jx,
            y: r * cellH + cellH / 2 + jy
          });
        }
      }

      // 무작위 순서로 섞어서 한쪽 극단의 글자 픽셀이 홈 그리드를 독식하지 않도록(공평하게) 처리
      for (let i = homes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [homes[i], homes[j]] = [homes[j], homes[i]];
      }
      homes.length = totalParticles;

      // [자기장 자석 효과] 글자 픽셀이 자신과 가장 가까이 있는 파티클을 강제로 빨아들임
      // 이로 인해 글자 주변 입자들이 싹 사라지는 "빈 윤곽(Void)" 현상이 극적으로 생기며 안티그래비티 연출 형성
      const textParticlesData = [];
      const availableHomes = [...homes];

      for (const target of targetCoords) {
        let minDist = Infinity;
        let bestIndex = -1;
        // 남은 입자 중 이 글자 픽셀과 가장 가까운 놈 탐색
        for (let i = 0; i < availableHomes.length; i++) {
          const h = availableHomes[i];
          const dist = (h.x - target.x) ** 2 + (h.y - target.y) ** 2;
          if (dist < minDist) {
            minDist = dist;
            bestIndex = i;
          }
        }

        // 탐색된 입자를 글자에 끌려가는 자석 파티클로 배정
        if (bestIndex !== -1) {
          textParticlesData.push({
            home: availableHomes[bestIndex],
            target: target
          });
          availableHomes[bestIndex] = availableHomes[availableHomes.length - 1]; // Fast remove
          availableHomes.pop();
        }
      }

      particles.length = 0;

      // 1. 선택받은 파티클들 (가까운 자리에서 글자 모양으로 자석처럼 빨려들어옴, 따라서 빈자리 윤곽[Void]가 생김)
      for (const data of textParticlesData) {
        particles.push({
          isBackground: false,
          homeX: data.home.x,
          homeY: data.home.y,
          textX: data.target.x,
          textY: data.target.y,
          x: data.home.x + (Math.random() - 0.5) * 50,
          y: data.home.y + (Math.random() - 0.5) * 50,
          vx: 0,
          vy: 0,
          // 먼지처럼 아주 가늘게
          size: Math.random() * 0.9 + 0.8,
          ease: 0.04 + Math.random() * 0.04,
          angle: Math.random() * Math.PI * 2,
          speed: 0.01 + Math.random() * 0.02,
          radius: Math.random() * 5 + 2
        });
      }

      // 2. 선택받지 못한 나머지 파티클들 (단순 배경 역할 유지)
      for (let i = 0; i < availableHomes.length; i++) {
        const h = availableHomes[i];
        particles.push({
          isBackground: true,
          homeX: h.x,
          homeY: h.y,
          x: h.x + (Math.random() - 0.5) * 50,
          y: h.y + (Math.random() - 0.5) * 50,
          vx: 0,
          vy: 0,
          // 배경은 먼지보다도 더 아련하게
          size: Math.random() * 0.7 + 0.6,
          ease: 0.04 + Math.random() * 0.04,
          angle: Math.random() * Math.PI * 2,
          speed: 0.005 + Math.random() * 0.015,
          radius: Math.random() * 8 + 4
        });
      }
    };

    calculateTextCoords();

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateTextCoords, 300);
    };
    window.addEventListener('resize', handleResize);

    let mouseX = -1000;
    let mouseY = -1000;
    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        let tX, tY;

        if (isOpenRef.current && !p.isBackground) {
          // 메뉴가 열렸을 때는 텍스트용 입자들만 글자(ㅎ, ㅇ) 좌표로 모이되,
          // 숨 쉬듯 미세하게 움직이도록 약간의 진동을 주어 살아있는 형태를 만듭니다.
          p.angle += p.speed * 2.5;
          const wobble = p.radius * 0.6; // 글자 형태가 망가지지 않을 정도의 미세 바이브레이션
          tX = p.textX + Math.cos(p.angle * 1.3) * wobble;
          tY = p.textY + Math.sin(p.angle * 0.8) * wobble;
        } else {
          // 메뉴가 닫혔을 때나, 백그라운드 전용 입자일 때는 자기 지정석(home)을 맴돎
          p.angle += p.speed;
          tX = p.homeX + Math.cos(p.angle) * p.radius;
          tY = p.homeY + Math.sin(p.angle) * p.radius;
        }

        // --- 마우스 반발력 (자석의 같은 극 효과) ---
        let repelX = 0;
        let repelY = 0;
        const mDistX = p.x - mouseX;
        const mDistY = p.y - mouseY;
        const mDist = Math.sqrt(mDistX * mDistX + mDistY * mDistY);
        const repelRadius = 150; // 커서를 감지할 반경

        // 커서에 가까워지면 부드럽게 밀어냄 (너무 심하지 않게 최대 50px)
        if (mDist < repelRadius && mDist > 0) {
          const force = (repelRadius - mDist) / repelRadius;
          const strength = 70;
          repelX = (mDistX / mDist) * force * strength;
          repelY = (mDistY / mDist) * force * strength;
        }

        const dx = (tX + repelX) - p.x;
        const dy = (tY + repelY) - p.y;

        // 관성 감속 (부드러운 에니메이션 연결고리)
        p.vx *= 0.85;
        p.vy *= 0.85;

        // 완전한 Cubic Ease-Out 무반동 흡수 보간법
        p.x += dx * p.ease + p.vx;
        p.y += dy * p.ease + p.vy;

        // 투명도를 은은하게 주어 모던하게 (배경이나 해제 상태일 땐 약간 투명)
        ctx.fillStyle = isOpenRef.current && !p.isBackground ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // z-0으로 가장 뒤에 렌더링하여 로고/메뉴 등 UI 뒤로 가려지게 만듦
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-screen h-screen z-0 pointer-events-none"
    />
  );
};

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

  return (
    <>
      {/* 캔버스가 overflow-hidden 내부에 갇히지 않도록 최상단으로 분리 */}
      <ParticleSystem isOpen={isOpen} />

      <div className="flex-grow flex flex-col items-center pt-8 pb-2 relative overflow-hidden bg-transparent w-full border-t border-transparent z-10">
        <div
          className="relative z-10 flex items-center justify-center rounded-full"
          style={{ width: `${SVG_SIZE}px`, height: `${SVG_SIZE}px`, maxWidth: '100vw' }}
        >
          {/* 중앙 로고 */}
          <div
            className="z-30 transition-transform duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative cursor-pointer"
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
    </>
  );
}
