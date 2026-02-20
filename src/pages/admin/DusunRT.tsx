import { useEffect, useRef, useState } from 'react';
import { Plus, Edit2, Trash2, MapPin, X } from 'lucide-react';
import './DusunRT.css';
import { dusunService, type DusunItem } from '../../services/dusunService';

const DusunRT = () => {
  const [dusunList, setDusunList] = useState<DusunItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingDusun, setEditingDusun] = useState<DusunItem | null>(null);
  const [dusunInput, setDusunInput] = useState('');
  const [rtInputs, setRtInputs] = useState<string[]>(['']);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const notificationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (notificationTimerRef.current) {
        window.clearTimeout(notificationTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchDusun = async () => {
      setIsLoading(true);
      try {
        const data = await dusunService.getDusunWithRT();
        setDusunList(data);
      } catch (error) {
        showNotification('error', 'Gagal memuat data dusun dan RT.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDusun();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    if (notificationTimerRef.current) {
      window.clearTimeout(notificationTimerRef.current);
    }
    notificationTimerRef.current = window.setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const buildRtList = () => {
    return rtInputs
      .filter(rt => rt.trim())
      .map(rt => ({ nomor: rt.trim() }));
  };

  const refreshDusun = async () => {
    const data = await dusunService.getDusunWithRT();
    setDusunList(data);
  };

  const handleAddDusun = async () => {
    if (!dusunInput.trim() || !rtInputs.some(rt => rt.trim())) {
      showNotification('error', 'Nama dusun dan minimal 1 RT wajib diisi.');
      return;
    }

    try {
      setIsSaving(true);
      if (editingDusun) {
        await dusunService.updateDusun(editingDusun.id, {
          nama: dusunInput.trim(),
          rtList: buildRtList()
        });
        await refreshDusun();
        showNotification('success', 'Dusun berhasil diperbarui.');
      } else {
        await dusunService.createDusun({
          nama: dusunInput.trim(),
          rtList: buildRtList()
        });
        await refreshDusun();
        showNotification('success', 'Dusun berhasil disimpan.');
      }
      resetForm();
    } catch (error) {
      showNotification('error', 'Gagal menyimpan data. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditDusun = (dusun: DusunItem) => {
    setEditingDusun(dusun);
    setDusunInput(dusun.nama);
    setRtInputs(dusun.rtList.map(rt => rt.nomor));
    setShowModal(true);
  };

  const handleDeleteDusun = async (id: number) => {
    if (!confirm('Yakin ingin menghapus dusun ini beserta RT-nya?')) {
      return;
    }

    try {
      setIsDeleting(true);
      await dusunService.deleteDusun(id);
      await refreshDusun();
      showNotification('success', 'Dusun berhasil dihapus.');
    } catch (error) {
      showNotification('error', 'Gagal menghapus dusun. Coba lagi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const addRtInput = () => {
    setRtInputs([...rtInputs, '']);
  };

  const removeRtInput = (index: number) => {
    setRtInputs(rtInputs.filter((_, i) => i !== index));
  };

  const updateRtInput = (index: number, value: string) => {
    const newInputs = [...rtInputs];
    newInputs[index] = value;
    setRtInputs(newInputs);
  };

  const resetForm = () => {
    setDusunInput('');
    setRtInputs(['']);
    setEditingDusun(null);
    setShowModal(false);
  };

  return (
    <div className="dusun-rt-page">
      {notification && (
        <div className={`toast toast-${notification.type}`}>
          {notification.message}
        </div>
      )}
      <div className="page-header">
        <div>
          <h1>Kelola Dusun & RT</h1>
          <p>Manajemen data dusun dan RT untuk Desa Purwajaya</p>
        </div>
        <button className="btn-add" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={20} /> Tambah Dusun
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">Memuat data dusun...</div>
      ) : (
        <div className="dusun-grid">
          {dusunList.map(dusun => (
            <div key={dusun.id} className="dusun-card">
              <div className="dusun-header">
                <div className="dusun-title">
                  <MapPin size={20} />
                  <h3>{dusun.nama}</h3>
                </div>
                <div className="dusun-actions">
                  <button
                    className="btn-icon btn-edit"
                    onClick={() => handleEditDusun(dusun)}
                    disabled={isSaving || isDeleting}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    onClick={() => handleDeleteDusun(dusun.id)}
                    disabled={isSaving || isDeleting}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <div className="rt-list">
                <p className="rt-label">{dusun.rtList.length} RT:</p>
                <div className="rt-badges">
                  {dusun.rtList.map(rt => (
                    <span key={rt.id} className="rt-badge">RT {rt.nomor}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <h3>{editingDusun ? 'Edit Dusun' : 'Tambah Dusun'}</h3>
            
            <div className="form-group">
              <label>Nama Dusun</label>
              <input
                type="text"
                placeholder="Contoh: Dusun 5"
                value={dusunInput}
                onChange={(e) => setDusunInput(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Daftar RT</label>
              {rtInputs.map((rt, index) => (
                <div key={index} className="rt-input-group">
                  <input
                    type="text"
                    placeholder="Contoh: 001"
                    value={rt}
                    onChange={(e) => updateRtInput(index, e.target.value)}
                  />
                  {rtInputs.length > 1 && (
                    <button type="button" className="btn-remove" onClick={() => removeRtInput(index)}>
                      <X size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-add-rt" onClick={addRtInput}>
                <Plus size={18} /> Tambah RT
              </button>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={resetForm}>Batal</button>
              <button className="btn-save" onClick={handleAddDusun} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DusunRT;
