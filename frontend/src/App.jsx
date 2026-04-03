import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PageWrapper from './components/layout/PageWrapper';

import Home from './pages/Home';
import Login from './pages/Login';
import LoginSuccess from './pages/LoginSuccess';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import BoardList from './pages/BoardList';
import Board from './pages/Board';
import FilesList from './pages/FilesList';
import Timetable from './pages/Timetable';
import Menu from './pages/Menu';
import Attendance from './pages/Attendance';
import NumberPicker from './pages/NumberPicker';
import Calendar from './pages/Calendar';

function Ybt() { return <div className="py-20 text-center">열북타 준비 중</div>; }

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PageWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/login-success" element={<LoginSuccess />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-success" element={<RegisterSuccess />} />
            
            {/* Boards & Notices */}
            <Route path="/board" element={<Board />} />
            <Route path="/board/community" element={<BoardList title="커뮤니티" apiCategory="일반" />} />
            <Route path="/notice/class" element={<BoardList title="학급 공지사항" apiCategory="공지" />} />
            <Route path="/notice/assessments" element={<BoardList title="수행평가 공지" apiCategory="수행평가" />} />
            <Route path="/board/files" element={<FilesList />} />

            {/* Tools & Views */}
            <Route path="/menu" element={<Menu />} />
            <Route path="/ybt" element={<Ybt />} />
            <Route path="/timetable" element={<Timetable />} />
            <Route path="/attend" element={<Attendance />} />
            <Route path="/numberpicker" element={<NumberPicker />} />
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </PageWrapper>
      </AuthProvider>
    </BrowserRouter>
  );
}
