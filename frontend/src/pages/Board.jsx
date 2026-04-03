import { useState, useEffect, useRef } from 'react';
import { useAuth, useRequireAuth } from '../contexts/AuthContext';
import api from '../services/api';

const TABS = [
  { label: '공지사항', apiCategory: '공지' },
  { label: '수행평가', apiCategory: '수행' },
  { label: '커뮤니티', apiCategory: '일반' },
  { label: '파일공유', apiCategory: '파일' },
];

const PRIVILEGED_ROLES = ['관리자', '반장', '부반장', '선생님'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ────────────────────────────────────────────────
// 글쓰기 모달 폼
// ────────────────────────────────────────────────
function WriteForm({ onClose, onSuccess, activeCategory, activeLabel }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    deadline: '',
    nickname: '',
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const isCommunity = activeCategory === '일반';
  const isAssessment = activeCategory === '수행평가';
  const isFile = activeCategory === '파일';

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) { setFile(null); return; }
    if (f.size > MAX_FILE_SIZE) {
      setFileError('파일 크기는 10MB 이하여야 합니다.');
      setFile(null);
      fileInputRef.current.value = '';
      return;
    }
    setFileError('');
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isFile) {
        const fd = new FormData();
        fd.append('category', activeCategory);
        fd.append('title', form.title);
        fd.append('content', form.content);
        if (file) fd.append('file', file);
        await api.post('/boards', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const payload = {
          category: activeCategory,
          title: form.title,
          content: form.content,
          ...(isCommunity && form.nickname ? { nickname: form.nickname } : {}),
          ...(isAssessment && form.deadline
            ? { deadline: new Date(form.deadline).toISOString() }
            : {}),
        };
        await api.post('/boards', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      alert(err.response?.data?.error || '글 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-md border border-base-200 mb-2">
      <div className="card-body p-5">
        <h3 className="font-bold text-base mb-3">새 글 작성 — {activeLabel}</h3>
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* 닉네임 (커뮤니티 전용) */}
          {isCommunity && (
            <div>
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">닉네임 <span className="text-error">*</span></span>
              </label>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                placeholder="닉네임을 입력하세요"
                value={form.nickname}
                onChange={e => set('nickname', e.target.value)}
                required
              />
            </div>
          )}

          {/* 제목 */}
          <div>
            <label className="label py-1">
              <span className="label-text text-xs font-semibold">제목 <span className="text-error">*</span></span>
            </label>
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="제목을 입력하세요"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              required
            />
          </div>

          {/* 수행평가 → 마감일 */}
          {isAssessment && (
            <div>
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">마감 기한</span>
              </label>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={form.deadline}
                onChange={e => set('deadline', e.target.value)}
              />
            </div>
          )}

          {/* 파일공유 → 파일 업로드 */}
          {isFile && (
            <div>
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">파일 첨부 <span className="text-base-content/40">(10MB 이하)</span></span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                className="file-input file-input-bordered file-input-sm w-full"
                onChange={handleFileChange}
              />
              {fileError && <p className="text-error text-xs mt-1">{fileError}</p>}
              {file && <p className="text-success text-xs mt-1">✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
            </div>
          )}

          {/* 내용 */}
          <div>
            <label className="label py-1">
              <span className="label-text text-xs font-semibold">내용 <span className="text-error">*</span></span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="내용을 입력하세요..."
              value={form.content}
              onChange={e => set('content', e.target.value)}
              required
              rows={4}
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>취소</button>
            <button type="submit" className="btn btn-neutral btn-sm px-6" disabled={submitting}>
              {submitting ? <span className="loading loading-spinner loading-xs" /> : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// 댓글 컴포넌트 (커뮤니티 전용)
// ────────────────────────────────────────────────
function CommentSection({ boardId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${boardId}`);
      setComments(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComments(); }, [boardId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/comments', { boardId, nickname, content });
      setContent('');
      fetchComments();
    } catch (err) {
      alert(err.response?.data?.error || '댓글 등록 실패');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/comments/${id}`);
      fetchComments();
    } catch {
      alert('삭제 권한이 없습니다.');
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-base-200">
      <h4 className="text-xs font-bold mb-2 text-base-content/60">댓글 {comments.length > 0 && `(${comments.length})`}</h4>

      {/* 댓글 목록 */}
      {loading ? (
        <div className="text-center py-2"><span className="loading loading-spinner loading-xs" /></div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-base-content/40 mb-2">아직 댓글이 없습니다.</p>
      ) : (
        <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
          {comments.map(c => (
            <div key={c.id} className="flex items-start gap-2 text-xs bg-base-200/50 p-2 rounded">
              <div className="flex-1">
                <span className="font-bold">{c.nickname}</span>
                <span className="text-base-content/40 ml-2">{new Date(c.commentedAt).toLocaleDateString()}</span>
                <p className="mt-0.5 whitespace-pre-wrap">{c.content}</p>
              </div>
              {user && (c.authorId === user.id || PRIVILEGED_ROLES.includes(user.role)) && (
                <button className="btn btn-ghost btn-xs text-error shrink-0" onClick={() => handleDelete(c.id)}>삭제</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 댓글 작성 폼 */}
      {user && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              className="input input-bordered input-xs flex-shrink-0 w-28"
              placeholder="닉네임"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              required
            />
            <input
              type="text"
              className="input input-bordered input-xs flex-1"
              placeholder="댓글을 입력하세요..."
              value={content}
              onChange={e => setContent(e.target.value)}
              required
            />
            <button type="submit" className="btn btn-neutral btn-xs" disabled={submitting}>
              {submitting ? <span className="loading loading-spinner loading-xs" /> : '등록'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// 글 수정 인라인 폼
// ────────────────────────────────────────────────
function EditForm({ post, onCancel, onSuccess }) {
  const [title, setTitle] = useState(post.title || '');
  const [content, setContent] = useState(post.content || '');
  const [deadline, setDeadline] = useState(
    post.deadline ? new Date(post.deadline).toISOString().split('T')[0] : ''
  );
  const [submitting, setSubmitting] = useState(false);

  const isAssessment = post.category === '수행평가';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { title, content };
      if (isAssessment) {
        payload.deadline = deadline || null;
      }
      await api.patch(`/boards/${post.id}`, payload);
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.error || '수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2">
      <input
        type="text"
        className="input input-bordered input-sm w-full"
        value={title}
        onChange={e => setTitle(e.target.value)}
        required
      />
      {isAssessment && (
        <input
          type="date"
          className="input input-bordered input-sm w-full"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
        />
      )}
      <textarea
        className="textarea textarea-bordered w-full text-sm"
        value={content}
        onChange={e => setContent(e.target.value)}
        required
        rows={3}
      />
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost btn-xs" onClick={onCancel}>취소</button>
        <button type="submit" className="btn btn-neutral btn-xs" disabled={submitting}>
          {submitting ? <span className="loading loading-spinner loading-xs" /> : '저장'}
        </button>
      </div>
    </form>
  );
}

// ────────────────────────────────────────────────
// 카테고리별 게시글 목록
// ────────────────────────────────────────────────
function BoardSection({ apiCategory, refreshKey }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const isCommunity = apiCategory === '일반';

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/boards', { params: { category: apiCategory } });
      setPosts(data);
    } catch {
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [apiCategory, refreshKey]);

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/boards/${id}`);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  const canModify = (post) => {
    if (!user) return false;
    return post.authorId === user.id || PRIVILEGED_ROLES.includes(user.role);
  };

  if (loading) return (
    <div className="text-center py-10">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );
  if (error) return <div className="alert alert-error text-sm">{error}</div>;
  if (posts.length === 0) return (
    <div className="text-center py-10 text-base-content/40">등록된 글이 없습니다.</div>
  );

  return (
    <div className="flex flex-col space-y-3">
      {posts.map(post => (
        <div key={post.id} className="collapse collapse-arrow bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow">
          <input type="checkbox" />
          {/* 닫힌 상태 — 제목만 표시 */}
          <div className="collapse-title pr-10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold text-sm truncate">{post.title}</span>
                {isCommunity && post.nickname && (
                  <span className="badge badge-ghost badge-sm text-xs">{post.nickname}</span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-base-content/50">{post.authorName}</span>
                <span className="text-xs text-base-content/40">
                  {new Date(post.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* 펼친 상태 — 내용 전체 */}
          <div className="collapse-content">
            {editingId === post.id ? (
              <EditForm
                post={post}
                onCancel={() => setEditingId(null)}
                onSuccess={() => { setEditingId(null); fetchPosts(); }}
              />
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm text-base-content/80">{post.content}</p>

                {/* 마감일 배지 */}
                {post.deadline && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs bg-neutral text-neutral-content px-2 py-1 rounded w-fit">
                    <span>📅</span>
                    <span>마감: {new Date(post.deadline).toLocaleDateString()}</span>
                    {post.dDayAlarm && <span>(D-{post.dDayAlarm} 알림)</span>}
                  </div>
                )}

                {/* 파일 첨부 */}
                {post.fileUrl && (
                  <a
                    href={post.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary underline w-fit"
                  >
                    📎 {post.fileName || '첨부파일 다운로드'}
                  </a>
                )}

                {/* 수정/삭제 버튼 */}
                {canModify(post) && (
                  <div className="flex gap-2 mt-3">
                    <button className="btn btn-outline btn-xs" onClick={(e) => { e.stopPropagation(); setEditingId(post.id); }}>수정</button>
                    <button className="btn btn-outline btn-error btn-xs" onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}>삭제</button>
                  </div>
                )}

                {/* 커뮤니티 댓글 */}
                {isCommunity && <CommentSection boardId={post.id} />}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────
// 메인 Board 페이지
// ────────────────────────────────────────────────
export default function Board() {
  const { isAuthed, loading, ToastComponent } = useRequireAuth();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => setRefreshKey(k => k + 1);

  // 비로그인 시 토스트 + 리다이렉트
  if (!isAuthed) {
    return (
      <div className="flex-grow flex items-center justify-center">
        {ToastComponent}
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  // 현재 탭에서 + 버튼 보일지 결정
  const currentTab = TABS[activeTab];
  const canWrite = (() => {
    if (!user) return false;
    if (currentTab.apiCategory === '공지' || currentTab.apiCategory === '수행평가') {
      return PRIVILEGED_ROLES.includes(user.role);
    }
    return true; // 커뮤니티, 파일공유는 모두 가능
  })();

  return (
    <div className="flex-grow w-full max-w-3xl mx-auto flex flex-col pt-6 pb-8 gap-4">
      <h2 className="text-2xl font-bold">게시판</h2>

      {/* 탭 + 글쓰기 버튼 (같은 줄) */}
      <div className="flex items-center justify-between border-b border-base-200">
        <div role="tablist" className="tabs tabs-bordered border-b-0">
          {TABS.map((tab, i) => (
            <a
              key={i}
              role="tab"
              className={`tab${activeTab === i ? ' tab-active' : ''}`}
              onClick={() => { setActiveTab(i); setShowForm(false); }}
            >
              {tab.label}
            </a>
          ))}
        </div>
        {canWrite && (
          <button
            className={`btn btn-sm mb-[1px] ${showForm ? 'btn-ghost' : 'btn-neutral'}`}
            onClick={() => setShowForm(v => !v)}
          >
            {showForm ? '-' : '+'}
          </button>
        )}
      </div>

      {/* 글쓰기 폼 */}
      {showForm && (
        <WriteForm
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
          activeCategory={currentTab.apiCategory}
          activeLabel={currentTab.label}
        />
      )}

      {/* 게시글 목록 */}
      <BoardSection
        apiCategory={currentTab.apiCategory}
        refreshKey={refreshKey}
      />
    </div>
  );
}
