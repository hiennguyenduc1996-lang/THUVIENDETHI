import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Folder, 
  Plus, 
  MoreVertical, 
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
  Download, 
  GripVertical,
  Palette,
  SortAsc,
  Clock,
  Save,
  X,
  FileCheck,
  FileX
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
  'bg-slate-500', 'bg-blue-600', 'bg-emerald-600', 'bg-violet-600', 
  'bg-amber-500', 'bg-rose-500', 'bg-cyan-600', 'bg-indigo-600'
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
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition-all shadow-sm shadow-blue-200"
          >
            <Plus size={16} /> Ngăn Mới
          </button>
          <button 
            onClick={() => setSortMode(sortMode === 'name' ? 'time' : 'name')}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500"
            title={sortMode === 'name' ? 'Sắp xếp theo thời gian' : 'Sắp xếp theo tên'}
          >
            {sortMode === 'name' ? <SortAsc size={18} /> : <Clock size={18} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {isAdding && (
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-left-4">
            <input 
              autoFocus
              className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Nhập tên ngăn..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onBlur={confirmAdd}
              onKeyDown={(e) => e.key === 'Enter' && confirmAdd()}
            />
            <div className="flex gap-1 flex-wrap">
              {COLORS.map(c => (
                <button 
                  key={c}
                  onMouseDown={(e) => { e.preventDefault(); setSelectedColor(c); }} // prevent blur
                  className={`w-5 h-5 rounded-full ${c} ${selectedColor === c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : ''}`}
                />
              ))}
            </div>
          </div>
        )}

        {sortedShelves.map((shelf: Shelf) => (
          <div 
            key={shelf.id}
            onClick={() => onSelect(shelf.id)}
            className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              activeShelfId === shelf.id 
                ? 'bg-blue-50 border border-blue-100 shadow-sm' 
                : 'hover:bg-slate-50 border border-transparent'
            }`}
          >
            <div className={`w-3 h-10 rounded-full ${shelf.color} shadow-sm`}></div>
            <div className="flex-1 min-w-0">
              {editingId === shelf.id ? (
                 <input 
                  ref={inputRef}
                  className="w-full bg-white border border-slate-300 rounded px-1 text-sm font-medium focus:outline-none focus:border-blue-500"
                  value={shelf.name}
                  onChange={(e) => onUpdateName(shelf.id, e.target.value)}
                  onBlur={() => setEditingId(null)}
                  onKeyDown={(e) => handleEditName(shelf.id, e)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                 />
              ) : (
                <h3 className={`font-semibold text-sm truncate ${activeShelfId === shelf.id ? 'text-blue-800' : 'text-slate-700'}`}>
                  {shelf.name}
                </h3>
              )}
              <p className="text-xs text-slate-400 mt-0.5">{shelf.topics.length} chủ đề</p>
            </div>
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1 bg-white/80 p-1 rounded-lg backdrop-blur-sm transition-opacity shadow-sm">
              <button onClick={(e) => { e.stopPropagation(); setEditingId(shelf.id); }} className="p-1.5 hover:bg-blue-100 text-slate-400 hover:text-blue-600 rounded">
                <Edit2 size={12} />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(shelf.id); }} className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded">
                <Trash2 size={12} />
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
  const [filterMode, setFilterMode] = useState<string>('all'); // all, completed-topic, incomplete-topic, completed-file, incomplete-file, has-answer, no-answer
  
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

  // Filter Logic
  const filteredTopics = useMemo(() => {
    let result = [...shelf.topics];
    
    // Sort logic handled by user manually, but here we render based on order
    // (Wait, user asked for manual sort of topics, we do that by array order in state)

    // Filter Search
    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter(t => 
        t.name.toLowerCase().includes(lowerSearch) || 
        t.files.some(f => f.questionFile?.name.toLowerCase().includes(lowerSearch) || f.answerFile?.name.toLowerCase().includes(lowerSearch))
      );
    }

    // Filter Mode
    if (filterMode !== 'all') {
      result = result.filter(t => {
        const total = t.files.length;
        const completed = t.files.filter(f => f.isCompleted).length;
        const isTopicCompleted = total > 0 && total === completed;

        switch (filterMode) {
          case 'completed-topic': return isTopicCompleted;
          case 'incomplete-topic': return !isTopicCompleted;
          // For file filters, we filter the FILES inside the render, but we need to keep the topic if it has matching files
          case 'completed-file': return t.files.some(f => f.isCompleted);
          case 'incomplete-file': return t.files.some(f => !f.isCompleted);
          case 'has-answer': return t.files.some(f => !!f.answerFile);
          case 'no-answer': return t.files.some(f => !f.answerFile);
          default: return true;
        }
      });
    }

    return result;
  }, [shelf.topics, search, filterMode]);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${shelf.color}`}></div>
          <h2 className="text-xl font-bold text-slate-800">{shelf.name}</h2>
          <span className="text-sm text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{shelf.topics.length} chủ đề</span>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Tìm kiếm file, chủ đề..."
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium">
              <Filter size={16} />
              <span className="hidden sm:inline">Bộ Lọc</span>
              <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden group-hover:block z-50">
               <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase">Trạng Thái Chủ Đề</div>
               <button onClick={() => setFilterMode('all')} className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${filterMode === 'all' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>Tất cả</button>
               <button onClick={() => setFilterMode('completed-topic')} className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${filterMode === 'completed-topic' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>Chủ đề đã hoàn thành</button>
               <button onClick={() => setFilterMode('incomplete-topic')} className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${filterMode === 'incomplete-topic' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>Chủ đề chưa hoàn thành</button>
               <div className="border-t border-slate-100 my-1"></div>
               <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase">Trạng Thái File</div>
               <button onClick={() => setFilterMode('completed-file')} className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${filterMode === 'completed-file' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>File đã xong</button>
               <button onClick={() => setFilterMode('incomplete-file')} className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${filterMode === 'incomplete-file' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>File chưa xong</button>
               <button onClick={() => setFilterMode('has-answer')} className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${filterMode === 'has-answer' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>Đã có đáp án</button>
               <button onClick={() => setFilterMode('no-answer')} className={`w-full text-left px-4 py-2 text-sm hover:bg-blue-50 ${filterMode === 'no-answer' ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>Chưa có đáp án</button>
            </div>
          </div>
        </div>
      </div>

      {/* Topics Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
        {filteredTopics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
             <Search size={48} className="mb-4 opacity-20" />
             <p>Chưa có chủ đề nào hoặc không tìm thấy kết quả.</p>
             <button onClick={addTopic} className="mt-4 text-blue-600 font-semibold hover:underline">Thêm chủ đề mới ngay</button>
          </div>
        ) : (
          filteredTopics.map((topic, index) => (
            <TopicItem 
              key={topic.id} 
              topic={topic} 
              onUpdate={(updates) => updateTopic(topic.id, updates)}
              onDelete={() => deleteTopic(topic.id)}
              onMoveUp={() => moveTopic(index, 'up')}
              onMoveDown={() => moveTopic(index, 'down')}
              filterMode={filterMode}
            />
          ))
        )}

        <button 
          onClick={addTopic}
          className="w-full py-4 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 font-semibold hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={24} /> Thêm Chủ Đề Mới
        </button>
        <div className="h-20"></div> {/* Bottom spacer */}
      </div>
    </div>
  );
};

// --- Single Topic Component ---

const TopicItem = ({ 
  topic, onUpdate, onDelete, onMoveUp, onMoveDown, filterMode 
}: { 
  topic: Topic, 
  onUpdate: (u: Partial<Topic>) => void, 
  onDelete: () => void,
  onMoveUp: () => void,
  onMoveDown: () => void,
  filterMode: string
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const totalFiles = topic.files.length;
  const completedFiles = topic.files.filter(f => f.isCompleted).length;
  const percent = totalFiles === 0 ? 0 : Math.round((completedFiles / totalFiles) * 100);

  // Filter Logic for Files Display
  const visibleFiles = topic.files.filter(f => {
    switch (filterMode) {
      case 'completed-file': return f.isCompleted;
      case 'incomplete-file': return !f.isCompleted;
      case 'has-answer': return !!f.answerFile;
      case 'no-answer': return !f.answerFile;
      default: return true;
    }
  });

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
        // Simple paste as a new file row with name
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
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                  {completedFiles}/{totalFiles} • {percent}%
                </span>
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
           </div>

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

// --- File Row Item ---

const FileRowItem = ({ 
  row, onUpdate, onDelete 
}: { 
  row: FileRow, 
  onUpdate: (u: Partial<FileRow>) => void, 
  onDelete: () => void 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const answerInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'question' | 'answer') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const meta: FileMeta = {
        id: crypto.randomUUID(),
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type,
        timestamp: Date.now()
      };
      
      if (type === 'question') onUpdate({ questionFile: meta });
      else onUpdate({ answerFile: meta });
    }
  };

  return (
    <div 
      className="flex flex-col md:flex-row md:items-center gap-4 p-3 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 group transition-all"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('rowId', row.id)}
    >
      <div className="cursor-move text-slate-300 hover:text-slate-500 hidden md:block">
        <GripVertical size={16} />
      </div>

      {/* Question File Area */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
        {row.questionFile ? (
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100 max-w-full">
            <div className="bg-blue-200 p-1.5 rounded text-blue-700">
              <FileText size={16} />
            </div>
            <div className="min-w-0">
               <p className="text-sm font-medium text-blue-900 truncate max-w-[200px] lg:max-w-[300px]" title={row.questionFile.name}>{row.questionFile.name}</p>
            </div>
            <button onClick={() => onUpdate({ questionFile: null })} className="text-blue-400 hover:text-red-500 ml-2"><X size={14}/></button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-slate-200 rounded-lg h-10 flex items-center px-3 text-slate-400 text-sm hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-500 cursor-pointer transition-colors"
          >
            <Plus size={14} className="mr-2" /> Thêm file đề bài...
          </div>
        )}
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'question')} />
      </div>

      <div className="hidden md:block text-slate-300">
         <ChevronRight size={16} />
      </div>

      {/* Answer File Area */}
      <div className="flex-1 min-w-0 flex items-center gap-3">
         {row.answerFile ? (
          <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100 max-w-full">
            <div className="bg-emerald-200 p-1.5 rounded text-emerald-700">
              <FileCheck size={16} />
            </div>
            <div className="min-w-0">
               <p className="text-sm font-medium text-emerald-900 truncate max-w-[200px] lg:max-w-[300px]" title={row.answerFile.name}>{row.answerFile.name}</p>
            </div>
            <button onClick={() => onUpdate({ answerFile: null })} className="text-emerald-400 hover:text-red-500 ml-2"><X size={14}/></button>
          </div>
        ) : (
          <div 
            onClick={() => answerInputRef.current?.click()}
            className="flex-1 border-2 border-dashed border-slate-200 rounded-lg h-10 flex items-center px-3 text-slate-400 text-sm hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-emerald-500 cursor-pointer transition-colors"
          >
            <Plus size={14} className="mr-2" /> Thêm đáp án...
          </div>
        )}
        <input ref={answerInputRef} type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'answer')} />
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-4 pl-4 md:border-l border-slate-100 min-w-[150px] justify-end">
        <div 
          onClick={() => onUpdate({ isCompleted: !row.isCompleted })}
          className={`flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-full transition-colors ${
            row.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {row.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
          <span className="text-sm font-medium">{row.isCompleted ? 'Hoàn thành' : 'Chưa xong'}</span>
        </div>
        
        <button 
          onClick={onDelete}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          title="Xóa dòng này"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
