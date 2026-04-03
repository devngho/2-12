import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';

export default function BoardList({ title, apiCategory }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', deadline: '', dDayAlarm: '' });

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/boards`, { params: { category: apiCategory } });
      setPosts(data);
    } catch (err) {
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [apiCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        category: apiCategory,
        content: newPost.content,
        deadline: newPost.deadline ? new Date(newPost.deadline).toISOString() : undefined,
        dDayAlarm: newPost.dDayAlarm ? parseInt(newPost.dDayAlarm) : undefined
      };
      await api.post('/boards', payload);
      setNewPost({ content: '', deadline: '', dDayAlarm: '' });
      setShowForm(false);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || '글 등록에 실패했습니다.');
    }
  };

  return (
    <div className="flex-grow w-full max-w-3xl mx-auto flex flex-col pt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-neutral btn-sm">
          {showForm ? '취소' : '글쓰기'}
        </button>
      </div>

      {showForm && (
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-2">새 글 작성</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea 
                className="textarea textarea-bordered w-full"
                placeholder="내용을 입력하세요..."
                value={newPost.content}
                onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                required
                rows={3}
              ></textarea>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <label className="label py-1"><span className="label-text text-xs">마감일 (선택)</span></label>
                  <input type="date" className="input input-bordered input-sm w-full" 
                    value={newPost.deadline} onChange={(e) => setNewPost({...newPost, deadline: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="label py-1"><span className="label-text text-xs">D-Day 알림 (일전)</span></label>
                  <input type="number" className="input input-bordered input-sm w-full" placeholder="예: 3"
                    value={newPost.dDayAlarm} onChange={(e) => setNewPost({...newPost, dDayAlarm: e.target.value})} />
                </div>
              </div>

              <div className="text-right mt-2">
                <button type="submit" className="btn btn-neutral btn-sm px-6">등록</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error text-sm">{error}</div>}

      <div className="flex flex-col space-y-4">
        {loading ? (
          <div className="text-center py-10"><span className="loading loading-spinner loading-lg"></span></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 text-base-content/50">등록된 글이 없습니다.</div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">{post.authorName}</div>
                  <div className="text-xs text-base-content/50">{new Date(post.createdAt).toLocaleDateString()}</div>
                </div>
                <p className="whitespace-pre-wrap text-sm">{post.content}</p>
                {post.deadline && (
                  <div className="mt-3 text-xs bg-base-200 p-2 rounded inline-block text-neutral-content bg-neutral w-fit">
                    마감일: {new Date(post.deadline).toLocaleDateString()} {post.dDayAlarm ? `(D-${post.dDayAlarm} 알림)` : ''}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
