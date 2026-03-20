'use client';

import { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';

// Types
interface ManualRecord {
  'User Name': string;
  'From Bank': string;
  'To Bank': string;
  'Deposit': number | string;
  'Date/Time': string;
  'Edited By': string;
}

interface QRPayRecord {
  'User Name': string;
  'Deposit': number | string;
  'Date/Time': string;
  'Reference'?: string;
}

interface FilteredRecord {
  'User Name': string;
  'Deposit': number | string;
  'Date/Time': string;
  'Reference': string;
  'Status': string;
}

export default function Home() {
  // State Management
  const [manualData, setManualData] = useState<ManualRecord[]>([]);
  const [qrpayData, setQrpayData] = useState<QRPayRecord[]>([]);
  const [filteredData, setFilteredData] = useState<FilteredRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [manualFileName, setManualFileName] = useState<string>('');
  const [qrpayFileName, setQrpayFileName] = useState<string>('');

  // Read Excel File
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Extract Date from DateTime string
  const extractDate = (datetime: string): string => {
    if (!datetime) return '';
    
    // Handle various date formats
    const dateMatch = datetime.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) return dateMatch[0];
    
    const date = new Date(datetime);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return datetime.split(' ')[0];
  };

  // Handle Manual File Upload
  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    setManualFileName(file.name);
    
    try {
      const data = await readExcelFile(file);
      setManualData(data);
      setSuccess(`Berhasil upload ${data.length} data manual`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error membaca file manual: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Handle QRPay File Upload
  const handleQRPayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    setQrpayFileName(file.name);
    
    try {
      const data = await readExcelFile(file);
      setQrpayData(data);
      setSuccess(`Berhasil upload ${data.length} data QRPay`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Error membaca file QRPay: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Filter Deposits
  const filterDeposits = () => {
    setLoading(true);
    setError('');
    
    try {
      // Create Set of users who already got bonus from manual data
      const bonusSet = new Set<string>();
      
      manualData.forEach(record => {
        const toBank = record['To Bank']?.toString() || '';
        if (toBank.toUpperCase().includes('BONUS DEPOSIT HARIAN')) {
          const userName = record['User Name']?.toString().trim();
          const date = extractDate(record['Date/Time']?.toString() || '');
          
          if (userName && date) {
            bonusSet.add(`${userName.toLowerCase()}|${date}`);
          }
        }
      });
      
      // Filter QRPay data
      const filtered = qrpayData
        .filter(record => {
          const userName = record['User Name']?.toString().trim();
          const date = extractDate(record['Date/Time']?.toString() || '');
          
          if (!userName || !date) return false;
          
          const key = `${userName.toLowerCase()}|${date}`;
          return !bonusSet.has(key);
        })
        .map(record => ({
          'User Name': record['User Name'],
          'Deposit': record['Deposit'],
          'Date/Time': record['Date/Time'],
          'Reference': record['Reference'] || '-',
          'Status': 'Belum Dapat Bonus'
        }));
      
      setFilteredData(filtered);
      
      if (filtered.length === 0) {
        setError('Tidak ada data yang belum mendapatkan bonus deposit harian');
      } else {
        setSuccess(`Ditemukan ${filtered.length} user yang belum mendapatkan bonus`);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      setError('Error saat memfilter data: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Download Excel
  const downloadExcel = () => {
    if (filteredData.length === 0) {
      setError('Tidak ada data untuk didownload');
      return;
    }
    
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Belum Dapat Bonus');
    
    const fileName = `deposit_belum_bonus_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    setSuccess(`Berhasil download ${filteredData.length} data`);
    setTimeout(() => setSuccess(''), 3000);
  };

  // Reset All Data
  const resetData = () => {
    setManualData([]);
    setQrpayData([]);
    setFilteredData([]);
    setManualFileName('');
    setQrpayFileName('');
    setError('');
    setSuccess('');
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Filter Deposit Bonus Harian
          </h1>
          <p className="text-gray-600">
          </p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <strong>Error!</strong> {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <strong>Success!</strong> {success}
          </div>
        )}

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Manual Deposit */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2">1</span>
              Deposit History (Manual)
            </h2>
            <div className="upload-area" onClick={() => document.getElementById('manual-upload')?.click()}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleManualUpload}
                className="hidden"
                id="manual-upload"
              />
              <div className="space-y-2">
                <div className="text-4xl">📁</div>
                <p className="text-gray-600">Klik untuk upload file manual</p>
                <p className="text-sm text-gray-400">Format: .xlsx, .xls</p>
                {manualFileName && (
                  <p className="text-green-600 text-sm mt-2">
                    ✓ {manualFileName} ({manualData.length} data)
                  </p>
                )}
              </div>
            </div>
            {manualData.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Preview:</strong> {manualData.slice(0, 3).map((d, i) => (
                    <span key={i} className="inline-block bg-gray-200 rounded px-2 py-1 text-xs mr-1">
                      {d['User Name']}
                    </span>
                  ))}
                  {manualData.length > 3 && `+${manualData.length - 3} lainnya`}
                </p>
              </div>
            )}
          </div>

          {/* QRPay Deposit */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2">2</span>
              Deposit History (QRPay)
            </h2>
            <div className="upload-area" onClick={() => document.getElementById('qrpay-upload')?.click()}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleQRPayUpload}
                className="hidden"
                id="qrpay-upload"
              />
              <div className="space-y-2">
                <div className="text-4xl">📱</div>
                <p className="text-gray-600">Klik untuk upload file QRPay</p>
                <p className="text-sm text-gray-400">Format: .xlsx, .xls</p>
                {qrpayFileName && (
                  <p className="text-green-600 text-sm mt-2">
                    ✓ {qrpayFileName} ({qrpayData.length} data)
                  </p>
                )}
              </div>
            </div>
            {qrpayData.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Preview:</strong> {qrpayData.slice(0, 3).map((d, i) => (
                    <span key={i} className="inline-block bg-gray-200 rounded px-2 py-1 text-xs mr-1">
                      {d['User Name']}
                    </span>
                  ))}
                  {qrpayData.length > 3 && `+${qrpayData.length - 3} lainnya`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {(manualData.length > 0 || qrpayData.length > 0) && (
          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={filterDeposits}
              disabled={loading || manualData.length === 0 || qrpayData.length === 0}
              className={`btn-primary ${(loading || manualData.length === 0 || qrpayData.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Memproses...' : '🔍 Filter Data'}
            </button>
            
            {filteredData.length > 0 && (
              <button onClick={downloadExcel} className="btn-success">
                📥 Download Excel
              </button>
            )}
            
            <button onClick={resetData} className="btn-danger">
              🔄 Reset Semua
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        {(manualData.length > 0 || qrpayData.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Total Data Manual</p>
              <p className="text-2xl font-bold">{manualData.length}</p>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Total Data QRPay</p>
              <p className="text-2xl font-bold">{qrpayData.length}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
              <p className="text-sm opacity-90">Belum Dapat Bonus</p>
              <p className="text-2xl font-bold">{filteredData.length}</p>
            </div>
          </div>
        )}

        {/* Results Table */}
        {filteredData.length > 0 && (
          <div className="card overflow-hidden">
            <div className="border-b pb-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Hasil Filter: User yang Belum Dapat Bonus
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Menampilkan {filteredData.length} dari {qrpayData.length} data QRPay
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deposit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date/Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{record['User Name']}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {typeof record['Deposit'] === 'number' 
                          ? `Rp ${record['Deposit'].toLocaleString('id-ID')}`
                          : record['Deposit']}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{record['Date/Time']}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{record['Reference']}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {record['Status']}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-800 mb-3 flex items-center">
            <span className="text-xl mr-2">ℹ️</span>
            Informasi Filter
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
            <div>
              <ul className="space-y-2">
                <li>✓ Data Manual dengan kolom <strong>"To Bank"</strong> mengandung <strong>"BONUS DEPOSIT HARIAN"</strong> dianggap sudah mendapatkan bonus</li>
                <li>✓ Perbandingan dilakukan berdasarkan <strong>User Name</strong> dan <strong>Tanggal</strong> yang sama</li>
                <li>✓ Hanya menampilkan data QRPay yang belum mendapatkan bonus di tanggal yang sama</li>
              </ul>
            </div>
            <div>
              <ul className="space-y-2">
                <li>📊 Mendukung file Excel (.xlsx, .xls)</li>
                <li>⚡ Optimasi untuk data besar (1000+ records)</li>
                <li>📥 Hasil filter bisa didownload dalam format Excel</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 border-t pt-6">
          <p>SCB Deposit Filter © {new Date().getFullYear()} - Filter data deposit untuk bonus harian</p>
        </footer>
      </div>
    </main>
  );
}
