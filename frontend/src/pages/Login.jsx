import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ studentId: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', formData);
      // 세션에서 유저 정보 가져오기
      const { data: session } = await api.get('/auth/session');
      login(session);
      navigate('/login-success');
    } catch (err) {
      setError(err.response?.data?.error || '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">로그인</h2>
          
          {error && <div className="alert alert-error text-sm rounded-lg p-3">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">학번</span></label>
              <input 
                type="text" 
                placeholder="예: 21200" 
                className="input input-bordered w-full" 
                required 
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              />
            </div>
            
            <div className="form-control">
              <label className="label"><span className="label-text">비밀번호</span></label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="input input-bordered w-full" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            <div className="form-control mt-6">
              <button disabled={loading} type="submit" className="btn btn-neutral w-full">
                {loading ? <span className="loading loading-spinner"></span> : '로그인'}
              </button>
            </div>
            
            <div className="text-center mt-4 text-sm text-base-content/70">
              계정이 없으신가요? <Link to="/register" className="link link-hover font-semibold text-neutral">회원가입</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
