import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, 
  FileText, 
  FolderPlus, 
  Settings, 
  Search, 
  Bell, 
  User, 
  Filter, 
  Download, 
  Trash2, 
  Eye,
  CheckCircle,
  Clock,
  BookOpen,
  GraduationCap
} from 'lucide-react';

// --- Types ---
interface ExamDocument {
  id: string;
  title: string;
  subject: string;
  grade: string;
  year: string;
  dateAdded: string;
  status: 'active' | 'draft' | 'archived';
  fileSize: string;
}

// --- Mock Data ---
const INITIAL_DATA: ExamDocument[] = [
  { id: '1', title: 'Đề thi cuối kì 1 Toán 12 - THPT Chuyên', subject: 'Toán Học', grade: '12', year: '2023-2024', dateAdded: '2023-12-15', status: 'active', fileSize: '2.4 MB' },
  { id: '2', title: 'Đề kiểm tra 1 tiết Ngữ Văn 10', subject: 'Ngữ Văn', grade: '10', year: '2023-2024', dateAdded: '2023-11-20', status: 'active', fileSize: '1.1 MB' },
  { id: '3', title: 'Đề thi thử THPT QG Tiếng Anh lần 1', subject: 'Tiếng Anh', grade: '12', year: '2024', dateAdded: '2024-01-10', status: 'draft', fileSize: '3.5 MB' },
  { id: '4', title: 'Tổng hợp công thức Vật Lý 11', subject: 'Vật Lý', grade: '11', year: '2023', dateAdded: '2023-10-05', status: 'active', fileSize: '5.2 MB' },
  { id: '5', title: 'Đề cương ôn tập Hóa Học 12', subject: 'Hóa Học', grade: '12', year: '2024', dateAdded: '2024-02-01', status: 'archived', fileSize: '1.8 MB' },
];

const SUBJECTS = ['Toán Học', 'Ngữ Văn', 'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Lịch Sử', 'Địa Lý'];

// --- Components ---

const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Tổng Quan' },
    { id: 'documents', icon: FileText, label: 'Kho Đề Thi' },
    { id: 'upload', icon: FolderPlus, label: 'Thêm Tài Liệu' },
    { id: 'settings', icon: Settings, label: 'Cài Đặt' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col fixed left-0 top-0 shadow-xl z-20 transition-all duration-300">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
          <BookOpen size={20} />
        </div>
        <h1 className="text-white font-bold text-lg tracking-wide">ExamManager</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' 
                : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <item.icon size={20} className={activeTab === item.id ? 'animate-pulse' : ''} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 cursor-pointer transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
            AD
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Admin User</p>
            <p className="text-xs text-slate-400">Trưởng Bộ Môn</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, colorClass, trend }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-2 rounded-lg ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center gap-2 text-xs font-medium">
        <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12%</span>
        <span className="text-slate-400">so với tháng trước</span>
      </div>
    )}
  </div>
);

const DashboardView = ({ documents }: { documents: ExamDocument[] }) => {
  const activeDocs = documents.filter(d => d.status === 'active').length;
  const subjectsCount = new Set(documents.map(d => d.subject)).size;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng Số Đề Thi" 
          value={documents.length} 
          icon={FileText} 
          colorClass="bg-blue-100 text-blue-600"
          trend={true}
        />
        <StatCard 
          title="Đang Hoạt Động" 
          value={activeDocs} 
          icon={CheckCircle} 
          colorClass="bg-emerald-100 text-emerald-600"
        />
        <StatCard 
          title="Môn Học" 
          value={subjectsCount} 
          icon={BookOpen} 
          colorClass="bg-violet-100 text-violet-600"
        />
        <StatCard 
          title="Khối Lớp" 
          value="3" 
          icon={GraduationCap} 
          colorClass="bg-amber-100 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Hoạt động gần đây</h3>
          <div className="space-y-4">
            {documents.slice(0, 4).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 text-sm">{doc.title}</h4>
                    <p className="text-xs text-slate-500">{doc.subject} • Khối {doc.grade}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{doc.dateAdded}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-4 text-lg">Phân bố môn học</h3>
          <div className="space-y-3">
             {Object.entries(documents.reduce((acc, doc) => {
                acc[doc.subject] = (acc[doc.subject] || 0) + 1;
                return acc;
             }, {} as Record<string, number>)).map(([subject, count]) => (
                <div key={subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{subject}</span>
                    <span className="text-slate-400">{count} đề</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ width: `${(count / documents.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentsView = ({ 
  documents, 
  onDelete 
}: { 
  documents: ExamDocument[], 
  onDelete: (id: string) => void 
}) => {
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('All');

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchSearch = doc.title.toLowerCase().includes(search.toLowerCase());
      const matchSubject = filterSubject === 'All' || doc.subject === filterSubject;
      return matchSearch && matchSubject;
    });
  }, [documents, search, filterSubject]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Tìm kiếm đề thi, tài liệu..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-700 placeholder-slate-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 appearance-none cursor-pointer"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="All">Tất cả môn</option>
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 font-medium">
            <Download size={18} />
            <span className="hidden sm:inline">Xuất báo cáo</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên Tài Liệu</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Môn Học</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Khối/Năm</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">{doc.title}</p>
                          <p className="text-xs text-slate-400">{doc.fileSize} • {doc.dateAdded}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {doc.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-600">
                        <p>Khối {doc.grade}</p>
                        <p className="text-xs text-slate-400">{doc.year}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        doc.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                        doc.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          doc.status === 'active' ? 'bg-emerald-500' :
                          doc.status === 'draft' ? 'bg-amber-500' :
                          'bg-slate-500'
                        }`}></span>
                        {doc.status === 'active' ? 'Đã duyệt' : doc.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Eye size={18} />
                        </button>
                        <button 
                          onClick={() => onDelete(doc.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={48} className="text-slate-200" />
                      <p>Không tìm thấy tài liệu nào phù hợp.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">Hiển thị {filteredDocs.length} trên tổng số {documents.length} kết quả</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-xs border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 text-xs border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-50">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UploadView = ({ onAdd }: { onAdd: (doc: ExamDocument) => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: SUBJECTS[0],
    grade: '12',
    year: new Date().getFullYear().toString(),
    status: 'draft' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newDoc: ExamDocument = {
      id: Date.now().toString(),
      ...formData,
      dateAdded: new Date().toISOString().split('T')[0],
      fileSize: (Math.random() * 5 + 0.5).toFixed(1) + ' MB'
    };
    onAdd(newDoc);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl border border-slate-200 shadow-lg p-8 animate-in zoom-in-95 duration-300">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto mb-4">
          <FolderPlus size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Thêm Đề Thi Mới</h2>
        <p className="text-slate-500">Nhập thông tin chi tiết để quản lý tài liệu hiệu quả</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Tên đề thi / Tài liệu <span className="text-red-500">*</span></label>
          <input 
            required
            type="text" 
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            placeholder="Ví dụ: Đề thi học kì 1 môn Toán 2024"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Môn học</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.subject}
              onChange={e => setFormData({...formData, subject: e.target.value})}
            >
              {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Khối lớp</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.grade}
              onChange={e => setFormData({...formData, grade: e.target.value})}
            >
              {[10, 11, 12].map(g => <option key={g} value={g}>Khối {g}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Năm học</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.year}
              onChange={e => setFormData({...formData, year: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Trạng thái</label>
            <select 
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="active">Công khai (Active)</option>
              <option value="draft">Bản nháp (Draft)</option>
              <option value="archived">Lưu trữ (Archived)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 border-dashed">
            <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Download className="w-8 h-8 mb-2 text-slate-400" />
                    <p className="text-sm text-slate-500"><span className="font-semibold text-blue-600">Click để tải lên</span> hoặc kéo thả file</p>
                    <p className="text-xs text-slate-400">PDF, DOCX (Max 10MB)</p>
                </div>
            </div>
        </div>

        <button 
          type="submit" 
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95"
        >
          Lưu & Thêm Mới
        </button>
      </form>
    </div>
  );
};

// --- Main App ---

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [documents, setDocuments] = useState<ExamDocument[]>(INITIAL_DATA);

  const handleAddDocument = (newDoc: ExamDocument) => {
    setDocuments([newDoc, ...documents]);
    setActiveTab('documents');
  };

  const handleDeleteDocument = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 p-8 min-h-screen">
        {/* Header Section */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'dashboard' && 'Tổng Quan Hệ Thống'}
              {activeTab === 'documents' && 'Kho Lưu Trữ Đề Thi'}
              {activeTab === 'upload' && 'Thêm Tài Liệu Mới'}
              {activeTab === 'settings' && 'Cài Đặt Hệ Thống'}
            </h2>
            <p className="text-slate-500 text-sm mt-1">Chào mừng quay trở lại, Thầy/Cô giáo.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 bg-white border border-slate-200 rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors shadow-sm">
              <Bell size={20} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">Nguyễn Văn A</p>
                <p className="text-xs text-slate-500">Admin</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                <User size={20} className="text-slate-500" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="min-h-[500px]">
          {activeTab === 'dashboard' && <DashboardView documents={documents} />}
          {activeTab === 'documents' && <DocumentsView documents={documents} onDelete={handleDeleteDocument} />}
          {activeTab === 'upload' && <UploadView onAdd={handleAddDocument} />}
          {activeTab === 'settings' && (
            <div className="flex items-center justify-center h-96 bg-white rounded-xl border border-slate-200 border-dashed">
                <div className="text-center text-slate-400">
                    <Settings size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Tính năng cài đặt đang được phát triển.</p>
                </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
