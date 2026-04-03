import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, name, role }
  const [loading, setLoading] = useState(true);

  // 앱 시작 시 세션 복원
  useEffect(() => {
    api.get('/auth/session')
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore */ }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

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
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setShowToast(true);
      const timer = setTimeout(() => {
        navigate('/login');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user, loading, navigate]);

  const ToastComponent = showToast ? (
    <div className="toast toast-center toast-top z-[9999]">
      <div className="alert bg-neutral text-white shadow-lg">
        <span>로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.</span>
      </div>
    </div>
  ) : null;

  return { isAuthed: !!user, loading, ToastComponent };
}
