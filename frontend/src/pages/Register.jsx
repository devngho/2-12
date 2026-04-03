import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ studentId: '', password: '', name: '', role: '일반' });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Registration status check (optional for UI dropdown logic but good to have)
  // We'll provide a simple static select for now. Can be expanded based on `/api/auth/registration-status`

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', formData);
      navigate('/register-success');
    } catch (err) {
      setError(err.response?.data?.error || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12">
      <div className="card w-full max-w-sm bg-base-100 shadow-xl border border-base-200">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">회원가입</h2>
          
          {error && <div className="alert alert-error text-sm rounded-lg p-3">{error}</div>}
          {successMsg && <div className="alert alert-success text-sm rounded-lg p-3">{successMsg}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">역할</span></label>
              <select 
                className="select select-bordered w-full"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="일반">일반 학생</option>
                <option value="반장">반장</option>
                <option value="부반장">부반장</option>
                <option value="선생님">선생님</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">{formData.role === '선생님' ? '아이디' : '학번'}</span>
              </label>
              <input 
                type="text" 
                placeholder={formData.role === '선생님' ? "teacher123" : "21200"} 
                className="input input-bordered w-full" 
                required 
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
              />
            </div>

            {formData.role !== '선생님' && (
              <div className="form-control">
                <label className="label"><span className="label-text">이름</span></label>
                <input 
                  type="text" 
                  placeholder="홍길동" 
                  className="input input-bordered w-full" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
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
                {loading ? <span className="loading loading-spinner"></span> : '가입하기'}
              </button>
            </div>
            
            <div className="text-center mt-4 text-sm text-base-content/70">
              이미 계정이 있으신가요? <Link to="/login" className="link link-hover font-semibold text-neutral">로그인</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
