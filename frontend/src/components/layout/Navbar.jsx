import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo1.svg';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="navbar bg-white border-b border-base-400 sticky top-0 z-50 px-0 min-h-0 py-0">
      <div className="flex-1 px-2">
        <Link to="/" className="inline-block transition-transform duration-200 hover:scale-105 focus:outline-none">
          <img src={logo} alt="Bugil212" className="select-none h-20 w-auto" />
        </Link>
      </div>
      <div className="flex-none px-4 flex items-center gap-3">
        {user ? (
          <>
            <span className="text-sm font-medium text-base-content/70">
              {user.id} {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="btn btn-outline border-black text-black hover:bg-black hover:text-white rounded-full px-6"
            >
              로그아웃
            </button>
          </>
        ) : (
          <Link to="/login" className="btn btn-outline border-black text-black hover:bg-black hover:text-white rounded-full px-6">
            로그인
          </Link>
        )}
      </div>
    </div>
  );
}
