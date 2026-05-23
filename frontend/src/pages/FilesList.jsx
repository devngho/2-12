import { useState, useEffect } from 'react';
import api from '../services/api';

export default function FilesList() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Upload state
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/files');
      setFiles(data);
    } catch (err) {
      setError('자료 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert('파일을 선택해주세요.');
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('description', description);
    
    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSelectedFile(null);
      setDescription('');
      setShowUpload(false);
      fetchFiles();
    } catch (err) {
      alert(err.response?.data?.error || '업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/files/${id}`);
      fetchFiles();
    } catch (err) {
      alert('삭제 권한이 없습니다.');
    }
  };

  const getFileUrl = (path) => `http://localhost:3000/${path}`;

  return (
    <div className="flex-grow w-full max-w-3xl mx-auto flex flex-col pt-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">자료 공유</h2>
        <button onClick={() => setShowUpload(!showUpload)} className="btn btn-neutral btn-sm">
          {showUpload ? '취소' : '업로드'}
        </button>
      </div>

      {showUpload && (
        <div className="card bg-base-100 shadow-md border border-base-200">
          <div className="card-body p-4">
            <h3 className="font-semibold mb-2">자료 업로드</h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <input type="file" className="file-input file-input-bordered file-input-sm w-full" 
                onChange={(e) => setSelectedFile(e.target.files[0])} />
              <input type="text" className="input input-bordered input-sm w-full" placeholder="설명 (선택)"
                value={description} onChange={(e) => setDescription(e.target.value)} />
              <div className="text-right mt-2">
                <button disabled={uploading} type="submit" className="btn btn-neutral btn-sm px-6">
                  {uploading ? '업로드 중...' : '올리기'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && <div className="alert alert-error text-sm">{error}</div>}

      <div className="flex flex-col space-y-2">
        {loading ? (
          <div className="text-center py-10"><span className="loading loading-spinner loading-lg"></span></div>
        ) : files.length === 0 ? (
          <div className="text-center py-10 text-base-content/50">등록된 자료가 없습니다.</div>
        ) : (
          files.map(file => (
            <div key={file._id} className="flex items-center justify-between p-3 bg-base-100 border border-base-200 rounded-lg hover:bg-base-200 transition-colors">
              <div className="flex flex-col flex-1 truncate mr-4">
                <a href={getFileUrl(file.filePath)} target="_blank" rel="noreferrer" className="font-medium truncate hover:underline">
                  {file.fileName || '자료'}
                </a>
                <div className="text-xs text-base-content/60 flex space-x-3 mt-1">
                  <span>{(file.size / 1024).toFixed(1)} KB</span>
                  <span>{new Date(file.uploadDate).toLocaleDateString()}</span>
                  <span>{file.preserve ? '🔒 보존됨' : ''}</span>
                </div>
              </div>
              <button onClick={() => handleDelete(file._id)} className="btn btn-ghost btn-xs text-error">삭제</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
