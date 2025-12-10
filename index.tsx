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
} from 'lucide-react';

// --- Types & Interfaces ---

interface FileMeta {
  id: string;
  name: string;
  size?: string;
  type: 'question' | 'answer';
  timestamp: number;
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Storage quota exceeded", e);
    alert("Cảnh báo: Bộ nhớ trình duyệt đã đầy. Một số file có thể không được lưu.");
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

  const deleteShelf = (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa ngăn này và toàn bộ dữ liệu bên trong?")) {
      const newShelves = shelves.filter(s => s.id !== id);
      setShelves(newShelves);
      if (newShelves.length > 0) setActiveShelfId(newShelves[0].id);
      else setActiveShelfId('');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
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

  const deleteTopic = (topicId: string) => {
    if (window.confirm("Xóa chủ đề này?")) {
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

      // Visibility Decision: 
      // Show topic if:
      // (TopicStatus matches) AND ( (Search matches TopicName) OR (Has visible matching files) )
      // If Search is empty, matchTopicName is false, but we should show if has visible files (or just all if no file filters).
      // Actually if search is empty, we show based on file filters.
      
      let shouldShow = matchTopicStatus;
      if (shouldShow) {
          if (search) {
              // If searching, show if name matches OR has matching files
              shouldShow = matchTopicName || visibleFiles.length > 0;
          } else {
              // If not searching, show if has matching files (if file filters are active)
              // If file filters are 'all', visibleFiles is all files. 
              // If topic has 0 files, and filters are all, show it? Yes.
              // If file filters are set, and visibleFiles is 0, hide topic? Yes, usually.
              if (filterFile !== 'all' || filterAnswer !== 'all') {
                  shouldShow = visibleFiles.length > 0;
              }
          }
      }

      // If Topic Name matches search, we want to show ALL files that match status filters, 
      // even if they don't match search text.
      // Re-calculate visible files if Topic Name matches? 
      // Let's stick to: "If topic name matches, show all files matching status filters"
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
              topic={item} // We pass the item which contains 'visibleFiles'
              visibleFiles={item.visibleFiles} // Explicitly pass visible files
              onUpdate={(updates) => updateTopic(item.id, updates)}
              onDelete={() => deleteTopic(item.id)}
              onMoveUp={() => moveTopic(index, 'up')}
              onMoveDown={() => moveTopic(index, 'down')}
            />
          ))
        )}

        {/* Add Topic Button - Only show if not searching/filtering heavily or always show at bottom? 
            Let's keep it visible so user can always add. */}
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
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  if (file) {
    return (
      <div className={`flex items-center gap-2 p-2 rounded-lg border text-sm ${isAnswer ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
        <span className="opacity-70">{icon}</span>
        <span className="truncate font-medium flex-1" title={file.name}>{file.name}</span>
        {file.size && <span className="text-[10px] opacity-60 shrink-0">{file.size}</span>}
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
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex items-center gap-2 p-2 rounded-lg border-2 border-dashed cursor-pointer transition-all h-[38px] ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-400'}`}
    >
      <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} />
      <span className="opacity-50">{icon}</span>
      <span className="text-xs font-medium">{placeholder}</span>
    </label>
  );
};

const FileRowItem = ({ 
  row, onUpdate, onDelete 
}: { 
  row: FileRow, 
  onUpdate: (updates: Partial<FileRow>) => void, 
  onDelete: () => void 
}) => {
  
  const handleFileUpload = (type: 'question' | 'answer', file: File) => {
    const fileMeta: FileMeta = {
      id: crypto.randomUUID(),
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type,
      timestamp: Date.now()
    };
    
    if (type === 'question') onUpdate({ questionFile: fileMeta });
    else onUpdate({ answerFile: fileMeta });
  };

  return (
    <div className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${row.isCompleted ? 'bg-slate-50 border-slate-100 opacity-75' : 'bg-white border-slate-200 hover:border-blue-300'}`}>
      
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
          onRemove={() => onUpdate({ questionFile: null })}
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
          onRemove={() => onUpdate({ answerFile: null })}
        />
      </div>

      {/* Actions */}
      <button 
        onClick={onDelete}
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
  visibleFiles: FileRow[], // Received from parent
  onUpdate: (u: Partial<Topic>) => void, 
  onDelete: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Stats - Calculate based on ALL files in topic, not just visible ones (usually stats reflect the real topic state)
  const totalFiles = topic.files.length;
  const completedFiles = topic.files.filter(f => f.isCompleted).length;
  const percent = totalFiles === 0 ? 0 : Math.round((completedFiles / totalFiles) * 100);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFileRows: FileRow[] = droppedFiles.map((file) => ({
        id: crypto.randomUUID(),
        questionFile: {
          id: crypto.randomUUID(),
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          type: 'question',
          timestamp: Date.now()
        },
        answerFile: null,
        isCompleted: false,
        order: Date.now()
      }));

      onUpdate({ files: [...topic.files, ...newFileRows] });
    }
  };

  const handlePaste = async () => {
     try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const newRow: FileRow = {
           id: crypto.randomUUID(),
           questionFile: {
             id: crypto.randomUUID(),
             name: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
             type: 'question',
             timestamp: Date.now()
           },
           answerFile: null,
           isCompleted: false,
           order: Date.now()
        };
        onUpdate({ files: [...topic.files, newRow]});
      }
     } catch (err) {
       console.error("Paste failed", err);
     }
  }

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
      className={`bg-white rounded-xl border transition-all duration-200 ${dragOver ? 'border-blue-400 ring-2 ring-blue-100 shadow-lg' : 'border-slate-200 shadow-sm'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleFileDrop}
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          handlePaste();
        }
      }}
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
           {dragOver && (
             <div className="absolute inset-0 bg-blue-50/90 flex flex-col items-center justify-center border-2 border-blue-500 border-dashed rounded-xl z-10">
               <Upload size={48} className="text-blue-600 animate-bounce" />
               <p className="font-bold text-blue-700 mt-2">Thả file vào đây để thêm nhanh</p>
             </div>
           )}

           <div className="space-y-1">
             {visibleFiles.map((row) => (
               <FileRowItem 
                 key={row.id} 
                 row={row} 
                 onUpdate={(updates) => updateRow(row.id, updates)}
                 onDelete={() => deleteRow(row.id)}
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
                    const evt = { preventDefault: () => {}, dataTransfer: { files: e.target.files } } as any;
                    handleFileDrop(evt);
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
