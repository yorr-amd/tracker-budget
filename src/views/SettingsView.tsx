import React, { useState } from 'react';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { useBudgetStore } from '@/hooks/useBudgetStore';
import { Category } from '@/types';
import { ICON_OPTIONS, COLOR_OPTIONS } from '@/lib/constants/defaults';
import { exportDataToJSON } from '@/lib/utils';
import { useAppUpdater } from '@/hooks/useAppUpdater';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  HardDrive,
  CheckCircle,
  Monitor,
  Sun,
  Moon,
  RefreshCw,
  ExternalLink,
  GitBranch,
  Sparkles,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    exportDatabaseBackup,
    importDatabaseBackup,
    resetAllDataToDefault,
  } = useBudgetStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'categories' | 'appearance' | 'backup' | 'about'>('categories');
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');

  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return 'system';
  });

  const {
    isTauriApp,
    status: updateStatus,
    updateInfo,
    downloadProgress,
    errorMessage: updateError,
    checkForUpdates,
    installUpdate,
  } = useAppUpdater();

  const handleSelectTheme = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    if (mode === 'system') {
      localStorage.removeItem('theme');
      const isSysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isSysDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (mode === 'dark') {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    } else {
      localStorage.setItem('theme', 'light');
      document.documentElement.classList.remove('dark');
    }
    window.dispatchEvent(new Event('theme-changed'));
    toast.success(
      `Tema berhasil diubah ke mode ${
        mode === 'system' ? 'Ikuti Sistem' : mode === 'dark' ? 'Gelap' : 'Terang'
      }.`,
      'Tema Diperbarui'
    );
  };

  // Confirm modals
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<{ id: string; name: string } | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any | null>(null);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catColor, setCatColor] = useState('#10B981');
  const [catError, setCatError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Backup message
  const [backupMessage, setBackupMessage] = useState('');

  const openAddCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatIcon('Tag');
    setCatColor('#10B981');
    setCatError('');
    setIsCategoryModalOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setCatError('');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      setCatError('Nama kategori tidak boleh kosong');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: catName,
          icon: catIcon,
          color: catColor,
        });
      } else {
        await addCategory({
          name: catName,
          type: categoryType,
          icon: catIcon,
          color: catColor,
          isDefault: false,
        });
      }
      setIsCategoryModalOpen(false);
    } catch (err: any) {
      setCatError(err.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!confirmDeleteCat) return;
    try {
      await deleteCategory(confirmDeleteCat.id);
      toast.success(`Kategori "${confirmDeleteCat.name}" berhasil dihapus.`, 'Kategori Dihapus');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kategori', 'Gagal');
    } finally {
      setConfirmDeleteCat(null);
    }
  };

  const handleExportJSON = async () => {
    try {
      const backupData = await exportDatabaseBackup();
      exportDataToJSON(backupData, 'tracker_budget_desktop_backup');
      toast.success('File backup JSON berhasil diunduh ke komputer Anda!', 'Backup Berhasil');
    } catch (err: any) {
      toast.error('Gagal mengekspor data: ' + err.message, 'Ekspor Gagal');
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setPendingImportData(json);
      } catch (err: any) {
        toast.error('File backup tidak valid: ' + err.message, 'Format File Salah');
      }
    };
    reader.readAsText(file);
    // Reset file input value so same file can be re-selected if needed
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingImportData) return;
    try {
      await importDatabaseBackup(pendingImportData);
      toast.success('Seluruh data cadangan berhasil dipulihkan!', 'Restore Berhasil');
    } catch (err: any) {
      toast.error('Gagal memulihkan database: ' + err.message, 'Gagal Restore');
    } finally {
      setPendingImportData(null);
    }
  };

  const handleConfirmReset = async () => {
    try {
      await resetAllDataToDefault();
      toast.success('Database berhasil di-reset ke kondisi awal (saldo Rp0).', 'Reset Berhasil');
    } catch (err: any) {
      toast.error('Gagal me-reset database: ' + err.message, 'Gagal Reset');
    } finally {
      setIsResetConfirmOpen(false);
    }
  };

  const displayedCategories = categories.filter((c) => c.type === categoryType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-emerald-600" />
          <span>Pengaturan & Cadangan Data</span>
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Kelola kategori kustom, ekspor/impor cadangan data, dan preferensi aplikasi desktop
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6 text-sm font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('categories')}
          className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Kelola Kategori
        </button>
        <button
          onClick={() => setActiveTab('appearance')}
          className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'appearance'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Tampilan & Tema
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'backup'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Cadangkan & Pulihkan (Backup)
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`pb-3 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'about'
              ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          Tentang & Pembaruan
        </button>
      </div>

      {backupMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4" />
          <span>{backupMessage}</span>
        </div>
      )}

      {/* TAB 1: Kategori */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl w-full sm:w-64">
              <button
                type="button"
                onClick={() => setCategoryType('expense')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  categoryType === 'expense'
                    ? 'bg-white dark:bg-zinc-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setCategoryType('income')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  categoryType === 'income'
                    ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Pemasukan
              </button>
            </div>

            <Button variant="primary" size="sm" onClick={openAddCategory}>
              <Plus className="w-3.5 h-3.5" />
              Tambah Kategori
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayedCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between group hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: cat.color }}
                  >
                    <DynamicIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 truncate">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditCategory(cat)}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {!cat.isDefault && (
                    <button
                      onClick={() => setConfirmDeleteCat({ id: cat.id, name: cat.name })}
                      className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Appearance & Theme */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 max-w-3xl">
          <Card className="space-y-6 p-6">
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Pengaturan Tema & Tampilan</span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Pilih gaya tampilan yang paling nyaman untuk mata Anda saat mencatat keuangan.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Mode */}
              <button
                type="button"
                onClick={() => handleSelectTheme('light')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  themeMode === 'light'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Mode Terang</span>
                    {themeMode === 'light' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Cerah & kontras jelas</p>
                </div>
              </button>

              {/* Dark Mode */}
              <button
                type="button"
                onClick={() => handleSelectTheme('dark')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  themeMode === 'dark'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Mode Gelap</span>
                    {themeMode === 'dark' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Nyaman di malam hari</p>
                </div>
              </button>

              {/* System Mode */}
              <button
                type="button"
                onClick={() => handleSelectTheme('system')}
                className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between h-36 ${
                  themeMode === 'system'
                    ? 'border-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">Ikuti Sistem</span>
                    {themeMode === 'system' && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Otomatis tema Windows</p>
                </div>
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: Backup & Restore */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Cadangkan Data (Export Backup)</span>
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Unduh seluruh data keuangan, mutasi transaksi, dompet, target tabungan, dan anggaran dalam bentuk file JSON. Simpan file ini di tempat aman sebagai cadangan.
            </p>
            <Button variant="primary" onClick={handleExportJSON}>
              <Download className="w-4 h-4" />
              Unduh Backup Data (.JSON)
            </Button>
          </Card>

          <Card className="space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>Pulihkan Data (Import Restore)</span>
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Pilih file JSON backup yang pernah Anda simpan sebelumnya untuk memulihkan seluruh data keuangan Anda ke aplikasi ini.
            </p>
            <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium text-sm rounded-xl cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Pilih File Backup JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </Card>

          {/* Reset Database */}
          <Card className="md:col-span-2 border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 space-y-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <RotateCcw className="w-4 h-4" />
                <span>Reset Database ke Data Awal</span>
              </CardTitle>
            </CardHeader>
            <p className="text-xs text-zinc-500">
              Tindakan ini akan menghapus semua data transaksi Anda dan mengembalikan aplikasi ke data demo bawaan.
            </p>
            <Button variant="danger" size="sm" onClick={() => setIsResetConfirmOpen(true)}>
              Reset Semua Data
            </Button>
          </Card>
        </div>
      )}

      {/* TAB 4: About & Auto-Update */}
      {activeTab === 'about' && (
        <div className="space-y-6 max-w-3xl">
          {/* Card: Auto-Update & GitHub Releases */}
          <Card className="space-y-5 p-6 border-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <RefreshCw className={`w-5 h-5 ${updateStatus === 'checking' ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      Pembaruan Aplikasi (Auto-Update)
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      v0.1.0
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Terhubung langsung ke GitHub Releases (<code className="text-emerald-600 dark:text-emerald-400">yorr-amd/tracker-budget</code>)
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => checkForUpdates(true)}
                isLoading={updateStatus === 'checking'}
                disabled={updateStatus === 'downloading'}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Periksa Pembaruan</span>
              </Button>
            </div>

            {/* Status Messages */}
            {updateStatus === 'up-to-date' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Aplikasi Anda sudah menggunakan versi paling mutakhir (v0.1.0).</span>
              </div>
            )}

            {updateStatus === 'available' && updateInfo && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    Versi Baru Tersedia: {updateInfo.version}
                  </span>
                  {updateInfo.date && (
                    <span className="text-[11px] text-zinc-500">{updateInfo.date}</span>
                  )}
                </div>
                {updateInfo.body && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-line bg-white/60 dark:bg-zinc-900/60 p-2.5 rounded-lg">
                    {updateInfo.body}
                  </p>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  onClick={installUpdate}
                  className="w-full sm:w-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh & Pasang Sekarang</span>
                </Button>
              </div>
            )}

            {updateStatus === 'downloading' && (
              <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <div className="flex justify-between text-xs font-semibold text-amber-900 dark:text-amber-200">
                  <span>Mengunduh paket pembaruan...</span>
                  <span>{downloadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-amber-200 dark:bg-amber-900/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all duration-300"
                    style={{ width: `${downloadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {updateStatus === 'ready' && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Pembaruan selesai diunduh! Aplikasi sedang memulai ulang...</span>
              </div>
            )}

            {updateStatus === 'error' && updateError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span>
                <span>{updateError}</span>
              </div>
            )}

            {/* GitHub Links */}
            <div className="flex flex-wrap gap-3 pt-2 text-xs">
              <a
                href="https://github.com/yorr-amd/tracker-budget"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <a
                href="https://github.com/yorr-amd/tracker-budget/releases"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium"
              >
                <span>Daftar Rilis (GitHub Releases)</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </Card>

          {/* Card: About Native Engine */}
          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Tracker Budget Desktop (Tauri 2 Native)
                </h3>
                <p className="text-xs text-zinc-500">
                  Aplikasi desktop bertenaga Rust + React dengan performa ultra cepat dan konsumsi memori minimal
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-4">
              <p className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>100% Offline & Privat:</strong> Seluruh data keuangan Anda tersimpan lokal di komputer Anda melalui basis data IndexedDB berkinerja tinggi. Tidak ada data yang dikirim ke server pihak ketiga.
                </span>
              </p>
              <p className="flex items-start gap-2">
                <HardDrive className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Tauri v2 Engine:</strong> Dibangun dengan Rust untuk binary native Windows yang aman, ringan (~30MB RAM), dan responsif seketika.
                </span>
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
        description={`Kategori untuk ${categoryType === 'income' ? 'Pemasukan' : 'Pengeluaran'}`}
        maxWidth="md"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Nama Kategori"
            placeholder="Contoh: Belanja Online, Servis Motor"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Warna Tema
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCatColor(c.value)}
                    className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                      catColor === c.value ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                Pilih Ikon
              </label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 rounded-xl max-h-28 overflow-y-auto">
                {ICON_OPTIONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setCatIcon(ic)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      catIcon === ic
                        ? 'bg-emerald-600 text-white'
                        : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    <DynamicIcon name={ic} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {catError && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 rounded-xl">
              {catError}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCategoryModalOpen(false)}
              className="w-1/3"
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-2/3"
              isLoading={isSubmitting}
            >
              {editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Category Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteCat}
        onClose={() => setConfirmDeleteCat(null)}
        onConfirm={handleConfirmDeleteCategory}
        title="Hapus Kategori?"
        message={`Apakah Anda yakin ingin menghapus kategori "${confirmDeleteCat?.name}"? Transaksi yang menggunakan kategori ini mungkin terpengaruh.`}
        confirmText="Hapus Kategori"
        variant="danger"
      />

      {/* Confirm Import Backup Overwrite Modal */}
      <ConfirmModal
        isOpen={!!pendingImportData}
        onClose={() => setPendingImportData(null)}
        onConfirm={handleConfirmImport}
        title="Pulihkan Data Cadangan (Restore)?"
        message="PERINGATAN: Mengimpor file backup ini akan menimpa seluruh data transaksi, dompet, dan anggaran saat ini dengan data dari file backup. Lanjutkan?"
        confirmText="Ya, Pulihkan Sekarang"
        variant="warning"
      />

      {/* Confirm Reset Database Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="Reset Semua Data?"
        message="PERINGATAN: Seluruh data transaksi, mutasi, anggaran, dan target tabungan Anda akan dihapus permanen, dan saldo semua akun akan dikembalikan ke Rp0. Apakah Anda yakin?"
        confirmText="Reset Database"
        variant="danger"
      />
    </div>
  );
};
