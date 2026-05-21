import { useEffect, useState } from "react";
import api from "../services/api";

export default function Admin() {
  return (
    <div className="flex flex-grow w-full max-w-4xl mx-auto flex flex-col pt-8 gap-4">
        <h2 className="text-3xl font-bold">관리자 페이지</h2>

        <h3 className="text-2xl font-bold">승인</h3>
        <Approver />
    </div>
  );
}

function Approver() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchPendingUsers = async (isOptimistic = false) => {
        try {
            if (!isOptimistic) setLoading(true);

            const { data } = await api.get('/auth/pending-approve');

            setPendingUsers(data);
        } catch (err) {
            setError('승인 대기 사용자 불러오기 실패: ' + (err.response?.data?.error || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchPendingUsers();
    }, []);

    const handleApproval = async (userId) => {
        try {
            pendingUsers.find(u => u._id === userId).isApproving = true;
            setPendingUsers([...pendingUsers]); // 상태 업데이트 트리거

            await api.patch(`/auth/approve/${userId}`);
            setPendingUsers(pendingUsers.filter(u => u._id !== userId));

            await fetchPendingUsers(true);
        } catch (err) {
            setError('사용자 승인 처리 실패: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="space-y-4">
            {loading && <span className="loading loading-spinner loading-lg" />}

            {!loading && (
                <>
                    {error && <p className="text-red-500">{error}</p>}

                    {!error && pendingUsers.length === 0 && (
                        <p>승인 대기 중인 사용자가 없습니다.</p>
                    )}
                    {pendingUsers.length > 0 && (
                        pendingUsers.map(user => (
                            <div key={user._id} className="flex items-center justify-between p-4 border rounded">
                                <span>{user.name} ({user.studentId}, {user.role})</span>
                                <div className="space-x-2">
                                    <button
                                        onClick={() => handleApproval(user._id)}
                                        disabled={user.isApproving}
                                        className="px-4 py-2 text-white rounded btn btn-outline"
                                    >
                                        {user.isApproving ? <span className="loading loading-spinner" /> : "승인"}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    );
}
