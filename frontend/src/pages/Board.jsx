import { useState, useEffect, useRef } from 'react';
import api from '../services/api';

const TABS = [
  { label: '공지사항', apiCategory: '공지' },
  { label: '수행평가', apiCategory: '수행' },
  { label: '커뮤니티', apiCategory: '일반' },
  { label: '파일공유', apiCategory: '파일' },
];

const TAG_OPTIONS = ['공지사항', '수행평가', '커뮤니티', '파일공유'];

const TAG_TO_CATEGORY = {
  '공지사항': '공지',
  '수행평가': '수행',
  '커뮤니티': '일반',
  '파일공유': '파일',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ────────────────────────────────────────────────
// 글쓰기 모달 폼
// ────────────────────────────────────────────────
function WriteForm({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    title: '',
    tag: '',
    content: '',
    deadline: '',
  });
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

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
    if (!form.tag) { alert('태그를 선택해주세요.'); return; }
    setSubmitting(true);
    try {
      if (form.tag === '파일공유') {
        const fd = new FormData();
        fd.append('category', TAG_TO_CATEGORY[form.tag]);
        fd.append('title', form.title);
        fd.append('content', form.content);
        if (file) fd.append('file', file);
        await api.post('/boards', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const payload = {
          category: TAG_TO_CATEGORY[form.tag],
          title: form.title,
          content: form.content,
          ...(form.tag === '수행평가' && form.deadline
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
        <h3 className="font-bold text-base mb-3">새 글 작성</h3>
        <form onSubmit={handleSubmit} className="space-y-3">

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

          {/* 태그 선택 */}
          <div>
            <label className="label py-1">
              <span className="label-text text-xs font-semibold">태그 <span className="text-error">*</span></span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => set('tag', tag)}
                  className={`badge badge-lg cursor-pointer border transition-all duration-150 px-3 py-3 text-xs font-semibold
                    ${form.tag === tag
                      ? 'badge-neutral text-white border-neutral'
                      : 'badge-ghost border-base-300 hover:border-neutral'
                    }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 수행평가 → 마감일 */}
          {form.tag === '수행평가' && (
            <div>
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">마감 기한 <span className="text-base-content/40">(선택)</span></span>
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
          {form.tag === '파일공유' && (
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
// 카테고리별 게시글 목록
// ────────────────────────────────────────────────
function BoardSection({ apiCategory, refreshKey }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <div key={post._id} className="card bg-base-100 shadow-sm border border-base-200 hover:shadow-md transition-shadow">
          <div className="card-body p-4">
            {/* 헤더 */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                {post.title && (
                  <p className="font-semibold text-sm leading-snug">{post.title}</p>
                )}
                <div className="text-xs text-base-content/50 mt-0.5">{post.authorName}</div>
              </div>
              <div className="text-xs text-base-content/40 shrink-0">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>

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
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSuccess = () => setRefreshKey(k => k + 1);

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
        <button
          className={`btn btn-sm mb-[1px] ${showForm ? 'btn-ghost' : 'btn-neutral'}`}
          onClick={() => setShowForm(v => !v)}
        >
          {showForm ? '-' : '+'}
        </button>
      </div>

      {/* 글쓰기 폼 */}
      {showForm && (
        <WriteForm
          onClose={() => setShowForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      {/* 게시글 목록 */}
      <BoardSection
        apiCategory={TABS[activeTab].apiCategory}
        refreshKey={refreshKey}
      />
    </div>
  );
}
