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

      oCtx.font = "900 500px system-ui"
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
      targetCoords = coords.slice(0, 1500);
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

      // [블랙홀처럼 회전 없이 직선으로 빨려들어가는 효과]
      // 파티클이 글자로 모일 때 서로 교차하며 뒤집어지지 않도록, 중심을 기준으로 각도(Angle)를 맞춰 1:1 배정합니다.
      const leftTargets = targetCoords.filter(t => t.x < width / 2);
      const rightTargets = targetCoords.filter(t => t.x >= width / 2);

      const leftCenter = { x: leftBoundary, y: visualCenterY };
      const rightCenter = { x: rightBoundary, y: visualCenterY };

      // 남은 입자들의 중심까지의 거리 산출
      let availableHomes = [...homes];
      availableHomes.forEach(h => {
        h.dL = (h.x - leftCenter.x) ** 2 + (h.y - leftCenter.y) ** 2;
        h.dR = (h.x - rightCenter.x) ** 2 + (h.y - rightCenter.y) ** 2;
      });

      // 가장 가까운 입자들을 추출 (원형 Void 형성 기준)
      availableHomes.sort((a, b) => a.dL - b.dL);
      const leftHomes = availableHomes.splice(0, leftTargets.length);

      availableHomes.sort((a, b) => a.dR - b.dR);
      const rightHomes = availableHomes.splice(0, rightTargets.length);

      // 교차(Flipping) 방지를 위해 중심점 기준 각도순 정렬
      leftTargets.forEach(t => t.angle = Math.atan2(t.y - leftCenter.y, t.x - leftCenter.x));
      leftHomes.forEach(h => h.angle = Math.atan2(h.y - leftCenter.y, h.x - leftCenter.x));
      leftTargets.sort((a, b) => a.angle - b.angle);
      leftHomes.sort((a, b) => a.angle - b.angle);

      rightTargets.forEach(t => t.angle = Math.atan2(t.y - rightCenter.y, t.x - rightCenter.x));
      rightHomes.forEach(h => h.angle = Math.atan2(h.y - rightCenter.y, h.x - rightCenter.x));
      rightTargets.sort((a, b) => a.angle - b.angle);
      rightHomes.sort((a, b) => a.angle - b.angle);

      particles.length = 0;

      // 1. 글자 형성 파티클
      const pushTextParticles = (homesArr, targetsArr) => {
        for (let i = 0; i < homesArr.length; i++) {
          particles.push({
            isBackground: false,
            homeX: homesArr[i].x,
            homeY: homesArr[i].y,
            textX: targetsArr[i].x,
            textY: targetsArr[i].y,
            x: homesArr[i].x + (Math.random() - 0.5) * 50,
            y: homesArr[i].y + (Math.random() - 0.5) * 50,
            vx: 0, vy: 0,
            size: Math.random() * 0.9 + 0.8,
            ease: 0.04 + Math.random() * 0.04,
            angle: Math.random() * Math.PI * 2,
            speed: 0.01 + Math.random() * 0.02,
            radius: Math.random() * 5 + 2
          });
        }
      };

      pushTextParticles(leftHomes, leftTargets);
      pushTextParticles(rightHomes, rightTargets);

      // 2. 순수 배경 파티클 (달라붙는 파티클은 별도의 동적 스폰 시스템에서 처리)
      for (let i = 0; i < availableHomes.length; i++) {
        const h = availableHomes[i];
        particles.push({
          isBackground: true,
          isSticky: false,
          homeX: h.x,
          homeY: h.y,
          x: h.x + (Math.random() - 0.5) * 50,
          y: h.y + (Math.random() - 0.5) * 50,
          vx: 0, vy: 0,
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

    // 동적 달라붙기(Sticky) 파티클 풀 - 별도 배열로 관리
    let stickyParticles = [];
    let lastStickySpawn = 0;

    // 화면 테두리 바깥에서 달라붙는 입자를 생성하는 팩토리
    const spawnStickyParticle = () => {
      if (targetCoords.length === 0) return;
      const randomTarget = targetCoords[Math.floor(Math.random() * targetCoords.length)];
      const edge = Math.floor(Math.random() * 4);
      const margin = 50;
      let sx, sy;
      if (edge === 0) { sx = Math.random() * width; sy = -margin - Math.random() * 80; }
      else if (edge === 1) { sx = width + margin + Math.random() * 80; sy = Math.random() * height; }
      else if (edge === 2) { sx = Math.random() * width; sy = height + margin + Math.random() * 80; }
      else { sx = -margin - Math.random() * 80; sy = Math.random() * height; }

      stickyParticles.push({
        stickyX: randomTarget.x,
        stickyY: randomTarget.y,
        x: sx, y: sy,
        vx: 0, vy: 0,
        size: Math.random() * 0.7 + 0.5,
        ease: 0.008 + Math.random() * 0.012,
        angle: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
        radius: Math.random() * 6 + 3,
        birthTime: Date.now(),
        lifetime: 3000 + Math.random() * 4000, // 3~7초 수명
        opacity: 0 // 페이드인부터 시작
      });
    };

    let animationFrameId;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      const now = Date.now();

      // --- 메뉴 열림 상태에서 지속적으로 달라붙는 입자 스폰 ---
      if (isOpenRef.current && targetCoords.length > 0) {
        // 매 프레임마다 확률적으로 1~3개씩 스폰 (약 60fps 기준 초당 ~120개)
        const spawnCount = Math.floor(Math.random() * 3) + 1;
        for (let s = 0; s < spawnCount; s++) {
          if (stickyParticles.length < 300) { // 최대 300개까지만 유지
            spawnStickyParticle();
          }
        }
      }

      // --- 수명 다한 달라붙기 입자 제거 ---
      stickyParticles = stickyParticles.filter(sp => {
        const age = now - sp.birthTime;
        return age < sp.lifetime;
      });

      // --- 메뉴 닫히면 전부 빠르게 소멸 ---
      if (!isOpenRef.current && stickyParticles.length > 0) {
        stickyParticles = stickyParticles.filter(sp => {
          sp.lifetime = Math.min(sp.lifetime, (now - sp.birthTime) + 500); // 0.5초 안에 소멸
          return (now - sp.birthTime) < sp.lifetime;
        });
      }

      // === 기존 파티클 렌더링 ===
      particles.forEach(p => {
        let tX, tY;

        if (isOpenRef.current && !p.isBackground) {
          p.angle += p.speed * 2.5;
          const wobble = p.radius * 0.6;
          tX = p.textX + Math.cos(p.angle * 1.3) * wobble;
          tY = p.textY + Math.sin(p.angle * 0.8) * wobble;
        } else {
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
        const repelRadius = 150;

        if (mDist < repelRadius && mDist > 0) {
          const force = (repelRadius - mDist) / repelRadius;
          const strength = 70;
          repelX += (mDistX / mDist) * force * strength;
          repelY += (mDistY / mDist) * force * strength;
        }

        // --- 중앙 로고/메뉴 영역 배제 (입자가 로고와 버튼 사이에 침범하지 않도록) ---
        if (isOpenRef.current) {
          const centerX = width / 2;
          const centerY = height / 2;
          const cDistX = p.x - centerX;
          const cDistY = p.y - centerY;
          const cDist = Math.sqrt(cDistX * cDistX + cDistY * cDistY);
          const exclusionRadius = 280; // outerRadius(250) + 여유분(30)

          if (cDist < exclusionRadius && cDist > 0) {
            const force = (exclusionRadius - cDist) / exclusionRadius;
            const strength = 120; // 강력하게 밀어내서 절대 침범 불가
            repelX += (cDistX / cDist) * force * strength;
            repelY += (cDistY / cDist) * force * strength;
          }
        }

        const dx = (tX + repelX) - p.x;
        const dy = (tY + repelY) - p.y;

        p.vx *= 0.85;
        p.vy *= 0.85;
        p.x += dx * p.ease + p.vx;
        p.y += dy * p.ease + p.vy;

        // --- 중앙 로고/메뉴 영역 배제 (로고~버튼 사이 틈새만 비움) ---
        if (isOpenRef.current) {
          const centerX = width / 2;
          const centerY = height / 2;
          const cDistX = p.x - centerX;
          const cDistY = p.y - centerY;
          const cDist = Math.sqrt(cDistX * cDistX + cDistY * cDistY);
          if (cDist < 180) return; // 로고 반지름(~128) + 약간의 여유만 비움
        }

        ctx.fillStyle = isOpenRef.current && !p.isBackground ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // === 달라붙기(Sticky) 파티클 렌더링 ===
      stickyParticles.forEach(sp => {
        sp.angle += sp.speed;
        const wobble = sp.radius * 1.2;
        const tX = sp.stickyX + Math.cos(sp.angle * 1.3) * wobble;
        const tY = sp.stickyY + Math.sin(sp.angle * 0.8) * wobble;

        const dx = tX - sp.x;
        const dy = tY - sp.y;
        sp.x += dx * sp.ease;
        sp.y += dy * sp.ease;

        // 수명에 따른 투명도 제어 (페이드인 + 페이드아웃)
        const age = now - sp.birthTime;
        const fadeInDur = 800;
        const fadeOutStart = sp.lifetime - 1000;
        if (age < fadeInDur) {
          sp.opacity = (age / fadeInDur) * 0.5;
        } else if (age > fadeOutStart) {
          sp.opacity = Math.max(0, ((sp.lifetime - age) / 1000) * 0.5);
        } else {
          sp.opacity = 0.5;
        }

        ctx.fillStyle = `rgba(0, 0, 0, ${sp.opacity})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
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
  const innerRadius = 130;
  const outerRadius = 250;
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
            className="z-30 transition-transform duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] relative cursor-pointer group"
            style={{ transform: isOpen ? 'scale(1.15)' : 'scale(1)' }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {/* 스케일 다운: w-80 -> w-64 변경하여 여백 확보 */}
            <img 
              src={logo2} 
              alt="Bugil212 Logo" 
              className={`w-64 h-auto drop-shadow-sm pointer-events-none transition-transform duration-500 
                ${!isOpen ? 'group-hover:scale-[1.07]' : ''}`} 
            />
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
                      className={isOpen ? 'pointer-events-auto' : 'pointer-events-none'}
                      style={{
                        transformOrigin: `${cx}px ${cy}px`,
                        transform: isOpen ? 'scale(1)' : 'scale(0.5)',
                        opacity: isOpen ? 1 : 0,
                        transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`
                      }}
                    >
                      <g
                        className="group cursor-pointer transition-transform duration-300 hover:scale-[1.04]"
                        style={{ transformOrigin: `${cx}px ${cy}px` }}
                        onClick={() => navigate(item.path)}
                      >
                        {/* 선의 두께를 사용하여 평행하고 일정한 틈을 만듦 */}
                        <path
                          d={pathD}
                          className="fill-[#f1f1f1] transition-colors duration-300 group-hover:fill-black"
                          style={{ stroke: '#ffffff', strokeWidth: '5px' }}
                        />
                        <text
                          x={textPos.x}
                          y={textPos.y}
                          textAnchor="middle"
                          dy="0.33em"
                          className="fill-gray-500 font-bold text-lg transition-colors duration-300 group-hover:fill-white select-none pointer-events-none"
                        >
                          {item.name}
                        </text>
                      </g>
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
