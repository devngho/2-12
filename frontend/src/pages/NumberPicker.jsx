import { useState } from 'react';

const ITEM_HEIGHT = 80;
const REEL_DIGITS = Array.from({ length: 200 }, (_, i) => i % 10);

function SlotReel({ index, duration, isResetting }) {
  return (
    <div className="relative" style={{ height: `${ITEM_HEIGHT}px`, width: '48px' }}>
      <div
        className="absolute top-0 left-0 flex flex-col items-center justify-start text-black dark:text-white w-full"
        style={{
          transform: `translateY(-${index * ITEM_HEIGHT}px)`,
          transition: isResetting ? 'none' : `transform ${duration}ms cubic-bezier(0.1, 0.9, 0.43, 1)`,
        }}
      >
        {REEL_DIGITS.map((digit, i) => (
          <div key={i} className="flex items-center justify-center font-black" style={{ height: `${ITEM_HEIGHT}px`, fontSize: '4rem', lineHeight: 1 }}>
            {digit}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NumberPicker() {
  const [pickedNumbers, setPickedNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [tensIndex, setTensIndex] = useState(0);
  const [unitsIndex, setUnitsIndex] = useState(0);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isResetting, setIsResetting] = useState(true);

  const TOTAL_NUMBERS = 29;
  const EXCLUDED_NUMBERS = [23];

  const handlePick = () => {
    if (isSpinning) return;

    // Generate available pool
    const pool = [];
    for (let i = 1; i <= TOTAL_NUMBERS; i++) {
      if (!EXCLUDED_NUMBERS.includes(i) && !pickedNumbers.includes(i)) {
        pool.push(i);
      }
    }

    if (pool.length === 0) {
      alert('모든 번호를 뽑았습니다!');
      return;
    }

    const finalNumber = pool[Math.floor(Math.random() * pool.length)];
    const targetTens = Math.floor(finalNumber / 10);
    const targetUnits = finalNumber % 10;

    setIsResetting(false);

    // Using setTimeout to guarantee the browser registers the removal of 'transition: none'
    setTimeout(() => {
      setIsSpinning(true);
      setIsEmpty(false);

      const newTensIndex = tensIndex + 40 + (targetTens - (tensIndex % 10)); // ~4 rotations -> overshoot of ~1.6 items
      const newUnitsIndex = unitsIndex + 60 + (targetUnits - (unitsIndex % 10)); // ~6 rotations -> overshoot of ~2.4 items

      setTensIndex(newTensIndex);
      setUnitsIndex(newUnitsIndex);

      setTimeout(() => {
        setIsSpinning(false);
        setCurrentNumber(finalNumber);
        setPickedNumbers(prev => [...prev, finalNumber]);

        // Quietly reset indices to avoid index growing too large after multiple spins
        setIsResetting(true);
        setTensIndex(newTensIndex % 10);
        setUnitsIndex(newUnitsIndex % 10);
      }, 3000); // Wait 3 seconds for the units column to finish spinning
    }, 50);
  };

  const handleReset = () => {
    if (confirm('초기화하시겠습니까?')) {
      setPickedNumbers([]);
      setCurrentNumber(null);
      setIsResetting(true);
      setTensIndex(0);
      setUnitsIndex(0);
      setIsEmpty(true);
    }
  };

  return (
    <div className="flex-grow w-full max-w-lg mx-auto flex flex-col pt-10 space-y-8 items-center text-center">
      <div className="w-full">
        <h2 className="select-none text-3xl font-bold mb-2">랜덤 번호 추첨</h2>
      </div>

      <div className="relative w-40 h-28 rounded-2xl border-[6px] border-base-300 flex items-center justify-center overflow-hidden bg-white dark:bg-base-200 shadow-inner">
        {isEmpty && <span className="select-none absolute text-6xl font-black z-10 w-full h-full flex items-center justify-center bg-white dark:bg-base-200">?</span>}

        <div className={`select-none flex gap-3 ${isEmpty ? 'opacity-0' : 'opacity-100'}`} style={{ height: `${ITEM_HEIGHT}px` }}>
          <SlotReel index={tensIndex} duration={3000} isResetting={isResetting} />
          <SlotReel index={unitsIndex} duration={3000} isResetting={isResetting} />
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          type="button"
          className="btn btn-neutral btn-lg px-10"
          onClick={handlePick}
          disabled={isSpinning}
        >
          뽑기
        </button>
        <button
          type="button"
          className="btn btn-neutral btn-lg px-7.5"
          onClick={handleReset}
        >
          초기화
        </button>
      </div>

      <div className="w-full card bg-base-100 shadow border border-base-200 mt-8">
        <div className="card-body p-4 text-left">
          <h3 className="select-none font-semibold mb-2">당첨된 번호 (총 {pickedNumbers.length}명)</h3>
          <div className="flex flex-wrap gap-2">
            {pickedNumbers.length === 0 ? <span className="opacity-50 text-sm">아직 없습니다.</span> : null}
            {pickedNumbers.map(num => (
              <span key={num} className="badge badge-lg badge-neutral">{num}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
