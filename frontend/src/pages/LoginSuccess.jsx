import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function LoginSuccess() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex-grow flex items-center justify-center py-12">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200 text-center">
        <div className="card-body items-center flex flex-col py-10">
          <div className="w-16 h-16 rounded-full bg-neutral text-white flex flex-col items-center justify-center mb-4 shadow-md">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="card-title text-2xl font-bold mb-2">환영합니다!</h2>
          <p className="text-base-content/70 text-sm mb-6 leading-relaxed">
            성공적으로 로그인되었습니다.<br/>
            잠시 후 메인 화면으로 이동합니다.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-outline w-full hover:bg-neutral hover:text-white">
            메인으로 바로가기
          </button>
        </div>
      </div>
    </div>
  );
}
