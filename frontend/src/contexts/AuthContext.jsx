import { createContext, useContext, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

/**
 * 비로그인 접근 제한 훅
 * 보호된 페이지 컴포넌트 최상단에서 호출하면,
 * 비로그인 시 토스트 팝업(2.5초) 표시 후 /login 으로 이동
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const timer = setTimeout(() => {
        navigate('/login?prev=' + pathname);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate, pathname]);

  const ToastComponent = (!loading && !user) ? (
    <div className="toast toast-center toast-top z-9999">
      <div className="alert bg-neutral text-white shadow-lg">
        <span>로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.</span>
      </div>
    </div>
  ) : null;

  return { isAuthed: !!user, loading, ToastComponent };
}
