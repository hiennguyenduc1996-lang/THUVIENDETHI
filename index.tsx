import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Folder, 
  Plus, 
  FileText, 
  CheckSquare, 
  Square, 
  Trash2, 
  Edit2, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter, 
  Upload, 
  GripVertical,
  SortAsc,
  Clock,
  X,
  FileCheck,
  Download
} from 'lucide-react';

// --- IndexedDB Helper ---
const DB_NAME = 'ExamManagerDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
        reject(new Error("IndexedDB not supported"));
        return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveFileContent = async (id: string, content: string) => {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(content, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Failed to save to IndexedDB", e);
  }
};

const getFileContent = async (id: string): Promise<string | undefined> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Failed to read from IndexedDB", e);
    return undefined;
  }
};

const deleteFileContent = async (id: string) => {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("Failed to delete from IndexedDB", e);
  }
};

// --- Types & Interfaces ---

interface FileMeta {
  id: string;
  name: string;
  type: 'question' | 'answer';
  timestamp: number;
  content?: string; // Optional in state, stored in IDB
}

interface FileRow {
  id: string;
  questionFile: FileMeta | null;
  answerFile: FileMeta | null;
  isCompleted: boolean;
  order: number;
}

interface Topic {
  id: string;
  name: string;
  order: number;
  isCollapsed: boolean;
  files: FileRow[];
  createdAt: number;
}

interface Shelf {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  topics: Topic[];
}

// --- Constants ---
const COLORS = [
  'bg-slate-600', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 
  'bg-amber-600', 'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600'
];

const DEFAULT_SHELF: Shelf = {
  id: 'shelf-default',
  name: 'Đề Thi 2024',
  color: 'bg-blue-600',
  createdAt: Date.now(),
  topics: []
};

// --- Storage Helper ---
const STORAGE_KEY = 'exam-manager-data-v1';

const saveToStorage = (data: Shelf[]) => {
  try {
    // Strip content before saving to LocalStorage to avoid quota limits
    const cleanData = data.map(shelf => ({
      ...shelf,
      topics: shelf.topics.map(topic => ({
        ...topic,
        files: topic.files.map(file => ({
          ...file,
          questionFile: file.questionFile ? { ...file.questionFile, content: undefined } : null,
          answerFile: file.answerFile ? { ...file.answerFile, content: undefined } : null
        }))
      }))
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanData));
  } catch (e) {
    console.error("Storage quota exceeded", e);
    alert("Cảnh báo: Không thể lưu cấu trúc dữ liệu do bộ nhớ đầy. Hãy xóa bớt các mục cũ.");
  }
};

const loadFromStorage = (): Shelf[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [DEFAULT_SHELF];
  } catch (e) {
    return [DEFAULT_SHELF];
  }
};

// --- Components ---

const App = () => {
  const [shelves, setShelves] = useState<Shelf[]>([]);
  const [activeShelfId, setActiveShelfId] = useState<string>('');
  const [sidebarSort, setSidebarSort] = useState<'name' | 'time'>('time');
  
  // Load data on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    setShelves(loaded);
    if (loaded.length > 0) setActiveShelfId(loaded[0].id);
  }, []);

  // Save data on change
  useEffect(() => {
    if (shelves.length > 0) saveToStorage(shelves);
  }, [shelves]);

  const activeShelf = useMemo(() => shelves.find(s => s.id === activeShelfId), [shelves, activeShelfId]);

  const handleAddShelf = (name: string, color: string) => {
    const newShelf: Shelf = {
      id: crypto.randomUUID(),
      name: name || 'Ngăn mới',
      color,
      createdAt: Date.now(),
      topics: []
    };
    setShelves([...shelves, newShelf]);
    setActiveShelfId(newShelf.id);
  };

  const updateShelf = (updatedShelf: Shelf) => {
    setShelves(shelves.map(s => s.id === updatedShelf.id ? updatedShelf : s));
  };

  const deleteShelf = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa ngăn này và toàn bộ dữ liệu bên trong?")) {
      // Cleanup IDB
      const shelfToDelete = shelves.find(s => s.id === id);
      if (shelfToDelete) {
        for (const topic of shelfToDelete.topics) {
          for (const file of topic.files) {
            if (file.questionFile) await deleteFileContent(file.questionFile.id);
            if (file.answerFile) await deleteFileContent(file.answerFile.id);
          }
        }
      }

      const newShelves = shelves.filter(s => s.id !== id);
      setShelves(newShelves);
      if (newShelves.length > 0) setActiveShelfId(newShelves[0].id);
      else setActiveShelfId('');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      <Sidebar 
        shelves={shelves} 
        activeShelfId={activeShelfId} 
        onSelect={setActiveShelfId}
        onAdd={handleAddShelf}
        onUpdateName={(id, name) => setShelves(shelves.map(s => s.id === id ? {...s, name} : s))}
        onDelete={deleteShelf}
        sortMode={sidebarSort}
        setSortMode={setSidebarSort}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {activeShelf ? (
          <ShelfDetail shelf={activeShelf} onUpdate={updateShelf} />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <Folder size={64} className="mx-auto mb-4 opacity-20" />
              <p>Chọn hoặc tạo một ngăn để bắt đầu quản lý</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Left Sidebar ---

const Sidebar = ({ 
  shelves, activeShelfId, onSelect, onAdd, onUpdateName, onDelete, sortMode, setSortMode 
}: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[1]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const sortedShelves = useMemo(() => {
    return [...shelves].sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      return b.createdAt - a.createdAt;
    });
  }, [shelves, sortMode]);

  const confirmAdd = () => {
    if (newName.trim()) {
      onAdd(newName, selectedColor);
      setNewName('');
      setIsAdding(false);
    } else {
      setIsAdding(false);
    }
  };

  const handleEditName = (id: string, e: any) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur();
    }
  };

  return (
    <div className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-lg z-20">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h1 className="font-bold text-xl text-blue-700 flex items-center gap-2 mb-4">
          <FileText className="fill-blue-600 text-blue-600" />
          Quản Lý Đề Thi
        </h1>
        <div className="flex gap-2">
           <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 text-slate-600 py-2 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            <Plus size={16} /> Ngăn Mới
          </button>
          <button 
            onClick={() => setSortMode(sortMode === 'name' ? 'time' : 'name')}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 text-slate-400 transition-colors"
            title={sortMode === 'name' ? 'Sắp xếp theo thời gian' : 'Sắp xếp theo tên'}
          >
            {sortMode === 'name' ? <SortAsc size={18} /> : <Clock size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isAdding && (
          <div className="bg-white p-4 rounded-2xl shadow-lg border border-blue-100 animate-in fade-in zoom-in-95">
            <input 
              autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              placeholder="Nhập tên ngăn..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={confirmAdd}
              onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
            />
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button 
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); setSelectedColor(c); }} // prevent blur
                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${c} ${selectedColor === c ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-110'}`}
                />
              ))}
            </div>
          </div>
        )}

        {sortedShelves.map((shelf: Shelf) => (
          <div 
            key={shelf.id}
            onClick={() => onSelect(shelf.id)}
            className={`group relative p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
              activeShelfId === shelf.id 
                ? `${shelf.color} text-white shadow-md shadow-slate-300 scale-[1.02]` 
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-100 hover:border-slate-200 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeShelfId === shelf.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                 <Folder size={20} />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === shelf.id ? (
                   <input 
                    ref={inputRef}
                    className="w-full bg-white/90 text-slate-800 rounded px-1 text-sm font-bold focus:outline-none shadow-sm"
                    value={shelf.name}
                    onChange={(e) => onUpdateName(shelf.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => handleEditName(shelf.id, e)}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                   />
                ) : (
                  <h3 className="font-bold text-sm truncate">{shelf.name}</h3>
                )}
                <p className={`text-xs mt-0.5 ${activeShelfId === shelf.id ? 'text-white/70' : 'text-slate-400'}`}>
                  {shelf.topics.length} chủ đề
                </p>
              </div>
            </div>

            <div className={`absolute top-2 right-2 flex gap-1 transition-opacity ${activeShelfId === shelf.id ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
               <button onClick={(e) => { e.stopPropagation(); setEditingId(shelf.id); }} className={`p-1.5 rounded-lg ${activeShelfId === shelf.id ? 'hover:bg-white/20 text-white' : 'hover:bg-slate-200 text-slate-400'}`}>
                 <Edit2 size={14} />
               </button>
               <button onClick={(e) => { e.stopPropagation(); onDelete(shelf.id); }} className={`p-1.5 rounded-lg ${activeShelfId === shelf.id ? 'hover:bg-white/20 text-white' : 'hover:bg-red-100 hover:text-red-500 text-slate-400'}`}>
                 <Trash2 size={14} />
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Right Area: Shelf Detail ---

const ShelfDetail = ({ shelf, onUpdate }: { shelf: Shelf, onUpdate: (s: Shelf) => void }) => {
  const [search, setSearch] = useState('');
  
  // New Filter States
  const [filterTopic, setFilterTopic] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [filterFile, setFilterFile] = useState<'all' | 'completed' | 'incomplete'>('all');
  const [filterAnswer, setFilterAnswer] = useState<'all' | 'has' | 'no'>('all');

  // Handlers for Topic Management
  const addTopic = () => {
    const newTopic: Topic = {
      id: crypto.randomUUID(),
      name: `Chủ đề mới ${shelf.topics.length + 1}`,
      order: shelf.topics.length,
      isCollapsed: false,
      files: [],
      createdAt: Date.now()
    };
    onUpdate({ ...shelf, topics: [newTopic, ...shelf.topics] });
  };

  const updateTopic = (topicId: string, updates: Partial<Topic>) => {
    const newTopics = shelf.topics.map(t => t.id === topicId ? { ...t, ...updates } : t);
    onUpdate({ ...shelf, topics: newTopics });
  };

  const deleteTopic = async (topicId: string) => {
    if (window.confirm("Xóa chủ đề này?")) {
      const topicToDelete = shelf.topics.find(t => t.id === topicId);
      if (topicToDelete) {
        for (const file of topicToDelete.files) {
          if (file.questionFile) await deleteFileContent(file.questionFile.id);
          if (file.answerFile) await deleteFileContent(file.answerFile.id);
        }
      }
      onUpdate({ ...shelf, topics: shelf.topics.filter(t => t.id !== topicId) });
    }
  };

  const moveTopic = (index: number, direction: 'up' | 'down') => {
    const newTopics = [...shelf.topics];
    if (direction === 'up' && index > 0) {
      [newTopics[index], newTopics[index - 1]] = [newTopics[index - 1], newTopics[index]];
    } else if (direction === 'down' && index < newTopics.length - 1) {
      [newTopics[index], newTopics[index + 1]] = [newTopics[index + 1], newTopics[index]];
    }
    onUpdate({ ...shelf, topics: newTopics });
  };

  // Filter Logic (Centralized)
  const processedTopics = useMemo(() => {
    return shelf.topics.map(topic => {
      // 1. Filter Files inside Topic first
      const visibleFiles = topic.files.filter(f => {
        // Search Filter (Applies to file name or Answer file name)
        const matchSearch = search ? (
          f.questionFile?.name.toLowerCase().includes(search.toLowerCase()) || 
          f.answerFile?.name.toLowerCase().includes(search.toLowerCase())
        ) : true;
        
        // File Status Filter
        const matchFileStatus = 
          filterFile === 'all' ? true :
          filterFile === 'completed' ? f.isCompleted :
          !f.isCompleted;

        // Answer Status Filter
        const matchAnswerStatus = 
          filterAnswer === 'all' ? true :
          filterAnswer === 'has' ? !!f.answerFile :
          !f.answerFile;

        return matchSearch && matchFileStatus && matchAnswerStatus;
      });

      // 2. Check Topic Status (based on all files, not just visible ones, usually)
      const total = topic.files.length;
      const completed = topic.files.filter(f => f.isCompleted).length;
      const isTopicCompleted = total > 0 && total === completed;

      const matchTopicStatus = 
          filterTopic === 'all' ? true :
          filterTopic === 'completed' ? isTopicCompleted :
          !isTopicCompleted;

      // 3. Match Topic Name with Search
      const matchTopicName = search ? topic.name.toLowerCase().includes(search.toLowerCase()) : false;

      // Visibility Decision
      let shouldShow = matchTopicStatus;
      if (shouldShow) {
          if (search) {
              // If searching, show if name matches OR has matching files
              shouldShow = matchTopicName || visibleFiles.length > 0;
          } else {
              if (filterFile !== 'all' || filterAnswer !== 'all') {
                  shouldShow = visibleFiles.length > 0;
              }
          }
      }

      let finalVisibleFiles = visibleFiles;
      if (matchTopicName) {
         finalVisibleFiles = topic.files.filter(f => {
             const matchFileStatus = filterFile === 'all' ? true : filterFile === 'completed' ? f.isCompleted : !f.isCompleted;
             const matchAnswerStatus = filterAnswer === 'all' ? true : filterAnswer === 'has' ? !!f.answerFile : !f.answerFile;
             return matchFileStatus && matchAnswerStatus;
         });
      }

      return {
        ...topic,
        visibleFiles: finalVisibleFiles,
        shouldShow
      };
    }).filter(t => t.shouldShow);
  }, [shelf.topics, search, filterTopic, filterFile, filterAnswer]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header with Search and Filters */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm z-10 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`w-2 h-6 rounded-full ${shelf.color}`}></div>
          <h2 className="text-xl font-bold text-slate-800">{shelf.name}</h2>
          <span className="text-sm text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{shelf.topics.length} chủ đề</span>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row items-center bg-slate-50 border border-slate-200 rounded-lg p-1 gap-2 lg:gap-0">
           {/* Search Input */}
           <div className="flex-1 flex items-center px-3 gap-2 w-full">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Tìm kiếm file hoặc chủ đề..." 
                className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-700 py-2 placeholder-slate-400 outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>

           {/* Divider */}
           <div className="hidden lg:block w-px h-6 bg-slate-300 mx-2"></div>

           {/* Filters */}
           <div className="flex flex-wrap items-center gap-4 px-3 w-full lg:w-auto justify-end">
              {/* Topic Filter */}
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chủ đề:</span>
                 <select 
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer hover:text-blue-600"
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value as any)}
                 >
                   <option value="all">Tất cả</option>
                   <option value="completed">Hoàn thành</option>
                   <option value="incomplete">Chưa xong</option>
                 </select>
              </div>

              <div className="w-px h-4 bg-slate-300 hidden sm:block"></div>

              {/* File Filter */}
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">File:</span>
                 <select 
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer hover:text-blue-600"
                  value={filterFile}
                  onChange={(e) => setFilterFile(e.target.value as any)}
                 >
                   <option value="all">Tất cả</option>
                   <option value="completed">Hoàn thành</option>
                   <option value="incomplete">Chưa xong</option>
                 </select>
              </div>

              <div className="w-px h-4 bg-slate-300 hidden sm:block"></div>

              {/* Answer Filter */}
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đáp án:</span>
                 <select 
                  className="bg-transparent text-sm font-semibold text-slate-700 focus:outline-none cursor-pointer hover:text-blue-600"
                  value={filterAnswer}
                  onChange={(e) => setFilterAnswer(e.target.value as any)}
                 >
                   <option value="all">Tất cả</option>
                   <option value="has">Có đáp án</option>
                   <option value="no">Chưa có</option>
                 </select>
              </div>
           </div>
        </div>
      </div>

      {/* Topics Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar bg-slate-50/50">
        {processedTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
             <Search size={48} className="mb-4 opacity-20" />
             <p>Không tìm thấy kết quả phù hợp.</p>
             {(search || filterTopic !== 'all' || filterFile !== 'all') && (
               <button 
                onClick={() => { setSearch(''); setFilterTopic('all'); setFilterFile('all'); setFilterAnswer('all'); }} 
                className="mt-2 text-blue-600 font-medium hover:underline text-sm"
               >
                 Xóa bộ lọc
               </button>
             )}
          </div>
        ) : (
          processedTopics.map((item, index) => (
            <TopicItem 
              key={item.id} 
              topic={item} 
              visibleFiles={item.visibleFiles}
              onUpdate={(updates) => updateTopic(item.id, updates)}
              onDelete={() => deleteTopic(item.id)}
              onMoveUp={() => moveTopic(index, 'up')}
              onMoveDown={() => moveTopic(index, 'down')}
            />
          ))
        )}

        {!search && filterTopic === 'all' && (
           <button 
            onClick={addTopic}
            className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 font-semibold hover:bg-white hover:border-blue-300 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={24} /> Thêm Chủ Đề Mới
          </button>
        )}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

// --- Single File Row Component ---

const FileSlot = ({ 
  file, placeholder, icon, isAnswer, onUpload, onRemove 
}: { 
  file: FileMeta | null, 
  placeholder: string, 
  icon: React.ReactNode,
  isAnswer?: boolean,
  onUpload: (f: File) => void,
  onRemove: () => void
}) => {
  // Removed drag state and handlers as per request to only use buttons/Ctrl+V for adding files.
  
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!file) return;

    let content = file.content;
    
    // If content is not in state (removed for storage optimization), fetch from IDB
    if (!content) {
       try {
         content = await getFileContent(file.id);
       } catch (err) {
         console.error("Download error", err);
       }
    }

    if (!content) {
      alert("Không tìm thấy nội dung file. Có thể file đã bị lỗi hoặc đã bị xóa khỏi bộ nhớ.");
      return;
    }
    
    const link = document.createElement('a');
    link.href = content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (file) {
    return (
      <div 
        onClick={handleDownload}
        className={`flex items-center gap-2 p-2 rounded-lg border text-sm cursor-pointer transition-all hover:shadow-md ${isAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-800 hover:bg-emerald-100' : 'bg-blue-50 border-blue-100 text-blue-800 hover:bg-blue-100'}`}
        title="Nhấn để tải file"
      >
        <span className="opacity-70">{icon}</span>
        <span className="truncate font-medium flex-1">{file.name}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="p-1 hover:bg-black/10 rounded-full transition-colors"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <label 
      className={`flex items-center gap-2 p-2 rounded-lg border-2 border-dashed cursor-pointer transition-all h-[38px] border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-400`}
    >
      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      <span className="opacity-50">{icon}</span>
      <span className="text-xs font-medium">{placeholder}</span>
    </label>
  );
};

const FileRowItem = ({ 
  row, index, onUpdate, onDelete, onDragStart, onDrop, isDraggable 
}: { 
  row: FileRow, 
  index: number,
  onUpdate: (updates: Partial<FileRow>) => void, 
  onDelete: () => void,
  onDragStart: (e: React.DragEvent, id: string) => void,
  onDrop: (e: React.DragEvent, id: string) => void,
  isDraggable: boolean
}) => {
  const [isOver, setIsOver] = useState(false);
  
  const handleFileUpload = (type: 'question' | 'answer', file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const fileId = crypto.randomUUID();
      
      // Save content to IndexedDB
      await saveFileContent(fileId, content);

      const fileMeta: FileMeta = {
        id: fileId,
        name: file.name,
        type,
        timestamp: Date.now(),
        // We can keep content in state for this session for speed, or set undefined.
        // Setting undefined ensures consistent behavior with reload, but keeping it makes current session fast.
        // Since we strip it in saveToStorage, it's safe to keep here for now.
        content: undefined 
      };
      
      if (type === 'question') onUpdate({ questionFile: fileMeta });
      else onUpdate({ answerFile: fileMeta });
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async () => {
    // Delete content from IDB
    if (row.questionFile) await deleteFileContent(row.questionFile.id);
    if (row.answerFile) await deleteFileContent(row.answerFile.id);
    onDelete();
  };

  const handleRemoveFile = async (type: 'question' | 'answer') => {
      if (type === 'question' && row.questionFile) {
          await deleteFileContent(row.questionFile.id);
          onUpdate({ questionFile: null });
      } else if (type === 'answer' && row.answerFile) {
          await deleteFileContent(row.answerFile.id);
          onUpdate({ answerFile: null });
      }
  };

  return (
    <div 
      draggable={isDraggable}
      onDragStart={(e) => onDragStart(e, row.id)}
      onDragOver={(e) => { e.preventDefault(); if(isDraggable) setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); onDrop(e, row.id); }}
      className={`group flex items-center gap-3 p-3 rounded-lg border transition-all 
        ${isOver ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100 z-10' : ''}
        ${row.isCompleted ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-slate-200 hover:border-blue-300'}
      `}
    >
      {/* Auto Numbering & Grip */}
      <div className={`flex items-center gap-2 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}>
         {/* Grip Handle - Visible on Hover if Draggable */}
         <div className={`text-slate-300 hover:text-slate-500 transition-opacity ${isDraggable ? 'opacity-0 group-hover:opacity-100' : 'hidden'}`}>
             <GripVertical size={16} />
         </div>

         {/* Modern Number Badge */}
         <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs shadow-inner shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors select-none">
            {index + 1}.
         </div>
      </div>
      
      {/* Checkbox */}
      <button 
        onClick={() => onUpdate({ isCompleted: !row.isCompleted })}
        className={`shrink-0 transition-colors ${row.isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'}`}
      >
        {row.isCompleted ? <CheckSquare size={20} /> : <Square size={20} />}
      </button>

      {/* Question File Slot */}
      <div className="flex-1 min-w-0">
        <FileSlot 
          file={row.questionFile} 
          placeholder="Đề bài" 
          icon={<FileText size={16} />}
          onUpload={(f) => handleFileUpload('question', f)}
          onRemove={() => handleRemoveFile('question')}
        />
      </div>

      {/* Arrow Divider */}
      <div className="text-slate-300">
        <ChevronRight size={16} />
      </div>

      {/* Answer File Slot */}
      <div className="flex-1 min-w-0">
         <FileSlot 
          file={row.answerFile} 
          placeholder="Đáp án" 
          icon={<FileCheck size={16} />}
          isAnswer
          onUpload={(f) => handleFileUpload('answer', f)}
          onRemove={() => handleRemoveFile('answer')}
        />
      </div>

      {/* Actions */}
      <button 
        onClick={handleDelete}
        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
        title="Xóa dòng"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// --- Single Topic Component ---

const TopicItem = ({ 
  topic, visibleFiles, onUpdate, onDelete, onMoveUp, onMoveDown
}: { 
  topic: Topic, 
  visibleFiles: FileRow[], 
  onUpdate: (u: Partial<Topic>) => void, 
  onDelete: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);

  const totalFiles = topic.files.length;
  const completedFiles = topic.files.filter(f => f.isCompleted).length;
  const percent = totalFiles === 0 ? 0 : Math.round((completedFiles / totalFiles) * 100);

  // Allow reorder only if viewing all files (no filtering active) for simplicity and data integrity
  const canReorder = visibleFiles.length === topic.files.length;

  const processFiles = (files: File[]) => {
      if (files.length > 0) {
        const filePromises = files.map(file => new Promise<FileRow>((resolve) => {
          const reader = new FileReader();
          reader.onload = async (ev) => {
            const content = ev.target?.result as string;
            const questionFileId = crypto.randomUUID();
            
            // Save to IDB
            await saveFileContent(questionFileId, content);

            resolve({
              id: crypto.randomUUID(),
              questionFile: {
                id: questionFileId,
                name: file.name,
                type: 'question',
                timestamp: Date.now(),
                content: undefined
              },
              answerFile: null,
              isCompleted: false,
              order: Date.now()
            });
          };
          reader.readAsDataURL(file);
        }));

        Promise.all(filePromises).then(newFileRows => {
           onUpdate({ files: [...topic.files, ...newFileRows] });
        });
      }
  };

  const handleRowDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('rowId', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRowDrop = (e: React.DragEvent, targetId: string) => {
    const draggedId = e.dataTransfer.getData('rowId');
    if (!draggedId || draggedId === targetId) return;

    const fromIndex = topic.files.findIndex(f => f.id === draggedId);
    const toIndex = topic.files.findIndex(f => f.id === targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const newFiles = [...topic.files];
      const [movedItem] = newFiles.splice(fromIndex, 1);
      newFiles.splice(toIndex, 0, movedItem);
      onUpdate({ files: newFiles });
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
    }

    e.preventDefault();

    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
        processFiles(Array.from(e.clipboardData.files));
        return;
    }

    const text = e.clipboardData.getData('text');
    if (text) {
         const newRow: FileRow = {
           id: crypto.randomUUID(),
           questionFile: {
             id: crypto.randomUUID(),
             name: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
             type: 'question',
             timestamp: Date.now(),
             content: undefined
           },
           answerFile: null,
           isCompleted: false,
           order: Date.now()
        };
        onUpdate({ files: [...topic.files, newRow]});
    }
  };

  const addNewRow = () => {
    const newRow: FileRow = {
      id: crypto.randomUUID(),
      questionFile: null,
      answerFile: null,
      isCompleted: false,
      order: Date.now()
    };
    onUpdate({ files: [...topic.files, newRow] });
  };

  const updateRow = (rowId: string, updates: Partial<FileRow>) => {
    const newFiles = topic.files.map(f => f.id === rowId ? { ...f, ...updates } : f);
    onUpdate({ files: newFiles });
  };

  const deleteRow = (rowId: string) => {
    onUpdate({ files: topic.files.filter(f => f.id !== rowId) });
  };

  const sortFilesByName = () => {
     const sorted = [...topic.files].sort((a, b) => {
       const nameA = a.questionFile?.name || '';
       const nameB = b.questionFile?.name || '';
       return nameA.localeCompare(nameB);
     });
     onUpdate({ files: sorted });
  };

  return (
    <div 
      className={`bg-white rounded-xl border transition-all duration-200 border-slate-200 shadow-sm outline-none ring-offset-2 focus:ring-2 focus:ring-blue-100`}
      tabIndex={0}
      onPaste={handlePaste}
    >
      {/* Topic Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/30 rounded-t-xl group">
        <div className="flex items-center gap-3 flex-1">
          <button 
            onClick={() => onUpdate({ isCollapsed: !topic.isCollapsed })}
            className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
          >
            {topic.isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
          </button>
          
          <div className="flex-1">
            {isEditingName ? (
              <input 
                autoFocus
                className="font-bold text-lg text-slate-800 bg-white border border-blue-300 rounded px-2 py-0.5 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={topic.name}
                onChange={(e) => onUpdate({ name: e.target.value })}
                onBlur={() => setIsEditingName(false)}
                onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              />
            ) : (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsEditingName(true)}>
                <h3 className="font-bold text-lg text-slate-800">{topic.name}</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded border ${percent === 100 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                  {percent}%
                </span>
                <span className="text-xs text-slate-400 font-normal">({completedFiles}/{totalFiles})</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={onMoveUp} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Lên"><ChevronDown size={16} className="rotate-180"/></button>
           <button onClick={onMoveDown} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Xuống"><ChevronDown size={16}/></button>
           <button onClick={sortFilesByName} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Sắp xếp A-Z"><SortAsc size={16}/></button>
           <button onClick={onDelete} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Xóa chủ đề"><Trash2 size={16}/></button>
        </div>
      </div>

      {/* Topic Content */}
      {!topic.isCollapsed && (
        <div className="p-4 bg-white rounded-b-xl">
           <div className="space-y-1">
             {visibleFiles.map((row, index) => (
               <FileRowItem 
                 key={row.id} 
                 index={index}
                 row={row} 
                 onUpdate={(updates) => updateRow(row.id, updates)}
                 onDelete={() => deleteRow(row.id)}
                 onDragStart={handleRowDragStart}
                 onDrop={handleRowDrop}
                 isDraggable={canReorder}
               />
             ))}
             {visibleFiles.length === 0 && topic.files.length > 0 && (
                <p className="text-center text-slate-400 text-sm py-4 italic">Các file trong chủ đề này đã bị ẩn bởi bộ lọc.</p>
             )}
           </div>

           {/* Show add buttons only if we are seeing all files or to allow adding even when filtered (UX choice: usually allow adding) */}
           <div className="mt-4 flex gap-3">
             <button 
               onClick={addNewRow}
               className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
             >
               <Plus size={16} /> Thêm Dòng
             </button>
             <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-blue-200">
               <Upload size={16} /> Tải File Lên
               <input 
                 type="file" 
                 multiple 
                 className="hidden" 
                 onChange={(e) => {
                    if (e.target.files) {
                        processFiles(Array.from(e.target.files));
                    }
                    e.target.value = '';
                 }}
               />
             </label>
           </div>
        </div>
      )}
    </div>
  );
};

// Initialize App
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}