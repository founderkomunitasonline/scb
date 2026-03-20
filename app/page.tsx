'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';

// Type definitions
interface DepositRecord {
  'User Name': string;
  'Deposit': number | string;
  'Date/Time': string;
  'Reference'?: string;
  [key: string]: any;
}

interface ManualRecord {
  'User Name': string;
  'From Bank': string;
  'To Bank': string;
  'Deposit': number | string;
  'Date/Time': string;
  'Edited By': string;
  [key: string]: any;
}

export default function Home() {
  const [manualData, setManualData] = useState<ManualRecord[]>([]);
  const [qrpayData, setQrpayData] = useState<DepositRecord[]>([]);
  const [filteredData, setFilteredData] = useState<DepositRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

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

  const extractDate = (datetime: string): string => {
    if (!datetime) return '';
    // Try to extract date in YYYY-MM-DD format
    const dateMatch = datetime.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) return dateMatch[0];
    
    // Try to parse as Date object
    const date = new Date(datetime);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // If all fails, return as is
    return datetime.split(' ')[0];
  };

  const filterDeposits = () => {
    setLoading(true);
    setError('');
    
    try {
      // Create a Set of users who already got bonus
      const bonusSet = new Set<string>();
      
      manualData.forEach(record => {
        const toBank = record['To Bank']?.toString() || '';
        if (toBank.includes('BONUS DEPOSIT HARIAN')) {
          const userName = record['User Name']?.toString().trim();
          const date = extractDate(record['Date/Time']?.toString() || '');
          
          if (userName && date) {
            bonusSet.add(`${userName}|${date}`);
          }
        }
      });
      
      // Filter QRPay data
      const filtered = qrpayData.filter(record => {
        const userName = record['User Name']?.toString().trim();
        const date = extractDate(record['Date/Time']?.toString() || '');
        
        if (!userName || !date) return false;
        
        const key = `${userName}|${date}`;
        return !bonusSet.has(key);
      });
      
      setFilteredData(filtered);
      
      if (filtered.length === 0) {
        setError('Tidak ada data yang belum mendapatkan bonus deposit harian');
      }
    } catch (err) {
      setError('Error saat memfilter data: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (filteredData.length === 0) {
      setError('Tidak ada data untuk didownload');
      return;
    }
    
    // Prepare data for export
    const exportData = filteredData.map(record => ({
      'User Name': record['User Name'],
      'Deposit': record['Deposit'],
      'Date/Time': record['Date/Time'],
      'Reference': record['Reference'] || '-'
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Belum Dapat Bonus');
    
    const fileName = `deposit_belum_bonus_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const data = await readExcelFile(file);
      setManualData(data);
      setError('');
    } catch (err) {
      setError('Error membaca file manual: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleQRPayUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setLoading(true);
      const data = await readExcelFile(file);
      setQrpayData(data);
      setError('');
    } catch (err) {
      setError('Error membaca file QRPay: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ background: '#f5f5f5' }}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>
          Filter Deposit - Bonus Harian
        </h1>
        <p className="mb-8" style={{ color: '#4b5563' }}>
          Menampilkan user dari QRPay yang belum mendapatkan bonus deposit harian
        </p>
        
        {error && (
          <div className="mb-4 p-4 rounded" style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626' }}>
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Manual Deposit Upload */}
          <div className="rounded-lg shadow-md p-6" style={{ background: '#ffffff' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#1f2937' }}>
              1. Deposit History (Manual)
            </h2>
            <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: '#d1d5db' }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleManualUpload}
                className="hidden"
                id="manual-upload"
              />
              <label
                htmlFor="manual-upload"
                className="cursor-pointer inline-block px-4 py-2 rounded transition"
                style={{ background: '#2563eb', color: '#ffffff' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
              >
                Upload File Manual
              </label>
              {manualData.length > 0 && (
                <p className="mt-3" style={{ color: '#16a34a' }}>
                  ✓ {manualData.length} data terupload
                </p>
              )}
              <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
                Format: .xlsx, .xls
              </p>
            </div>
          </div>
          
          {/* QRPay Upload */}
          <div className="rounded-lg shadow-md p-6" style={{ background: '#ffffff' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#1f2937' }}>
              2. Deposit History (QRPay)
            </h2>
            <div className="border-2 border-dashed rounded-lg p-6 text-center" style={{ borderColor: '#d1d5db' }}>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleQRPayUpload}
                className="hidden"
                id="qrpay-upload"
              />
              <label
                htmlFor="qrpay-upload"
                className="cursor-pointer inline-block px-4 py-2 rounded transition"
                style={{ background: '#2563eb', color: '#ffffff' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
              >
                Upload File QRPay
              </label>
              {qrpayData.length > 0 && (
                <p className="mt-3" style={{ color: '#16a34a' }}>
                  ✓ {qrpayData.length} data terupload
                </p>
              )}
              <p className="text-sm mt-2" style={{ color: '#6b7280' }}>
                Format: .xlsx, .xls
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={filterDeposits}
            disabled={loading || manualData.length === 0 || qrpayData.length === 0}
            className="px-6 py-2 rounded font-semibold"
            style={{
              background: loading || manualData.length === 0 || qrpayData.length === 0 ? '#9ca3af' : '#16a34a',
              color: '#ffffff',
              cursor: loading || manualData.length === 0 || qrpayData.length === 0 ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!(loading || manualData.length === 0 || qrpayData.length === 0)) {
                e.currentTarget.style.background = '#15803d';
              }
            }}
            onMouseLeave={(e) => {
              if (!(loading || manualData.length === 0 || qrpayData.length === 0)) {
                e.currentTarget.style.background = '#16a34a';
              }
            }}
          >
            {loading ? 'Memproses...' : 'Filter Data'}
          </button>
          
          {filteredData.length > 0 && (
            <button
              onClick={downloadExcel}
              className="px-6 py-2 rounded font-semibold"
              style={{ background: '#4f46e5', color: '#ffffff' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#4f46e5'}
            >
              Download Excel
            </button>
          )}
        </div>
        
        {/* Results Table */}
        {filteredData.length > 0 && (
          <div className="rounded-lg shadow-md overflow-hidden" style={{ background: '#ffffff' }}>
            <div className="px-6 py-4 border-b" style={{ background: '#f9fafb', borderColor: '#e5e7eb' }}>
              <h3 className="text-lg font-semibold" style={{ color: '#1f2937' }}>
                Hasil Filter: {filteredData.length} user belum dapat bonus
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead style={{ background: '#f9fafb' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                      User Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                      Deposit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: '#6b7280' }}>
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: '#e5e7eb' }}>
                  {filteredData.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#111827' }}>
                        {record['User Name']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#111827' }}>
                        {typeof record['Deposit'] === 'number' 
                          ? `Rp ${record['Deposit'].toLocaleString('id-ID')}`
                          : record['Deposit']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#111827' }}>
                        {record['Date/Time']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: '#111827' }}>
                        {record['Reference'] || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Info Panel */}
        <div className="mt-8 p-4 rounded-lg" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <h4 className="font-semibold mb-2" style={{ color: '#1e40af' }}>Informasi Filter:</h4>
          <ul className="text-sm space-y-1" style={{ color: '#1e3a8a' }}>
            <li>• Data Manual dengan kolom "To Bank" mengandung "BONUS DEPOSIT HARIAN" dianggap sudah mendapatkan bonus</li>
            <li>• Perbandingan dilakukan berdasarkan User Name dan Tanggal yang sama</li>
            <li>• Hanya menampilkan data QRPay yang belum mendapatkan bonus di tanggal yang sama</li>
            <li>• Mendukung file Excel (.xlsx, .xls)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
