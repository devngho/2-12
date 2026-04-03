import { useNavigate } from 'react-router-dom';

export default function RegisterSuccess() {
  const navigate = useNavigate();
  return (
    <div className="flex-grow flex items-center justify-center py-12">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200 text-center">
        <div className="card-body items-center flex flex-col py-10">
          <div className="w-16 h-16 rounded-full bg-neutral/10 text-neutral flex flex-col items-center justify-center mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="card-title text-2xl font-bold mb-2">회원가입 완료!</h2>
          <p className="text-base-content/70 text-sm mb-6 leading-relaxed">
            성공적으로 가입되었습니다.<br/>
            관리자 승인 후 즉시 이용 가능합니다.
          </p>
          <button onClick={() => navigate('/login')} className="btn btn-neutral w-full">
            로그인 화면으로
          </button>
        </div>
      </div>
    </div>
  );
}
