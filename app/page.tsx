'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

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

  const readFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      if (extension === 'xlsx' || extension === 'xls') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      } else if (extension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            resolve(results.data);
          },
          error: reject
        });
      } else {
        reject(new Error('Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv'));
      }
    });
  };

  const extractDate = (datetime: string): string => {
    if (!datetime) return '';
    const dateMatch = datetime.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) return dateMatch[0];
    
    const date = new Date(datetime);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    return datetime.split(' ')[0];
  };

  const filterDeposits = () => {
    setLoading(true);
    setError('');
    
    try {
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
    
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
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
      const data = await readFile(file);
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
      const data = await readFile(file);
      setQrpayData(data);
      setError('');
    } catch (err) {
      setError('Error membaca file QRPay: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">
          Filter Deposit - Bonus Harian
        </h1>
        <p className="text-gray-600 mb-8">
          Menampilkan user dari QRPay yang belum mendapatkan bonus deposit harian
        </p>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Manual Deposit Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              1. Deposit History (Manual)
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleManualUpload}
                className="hidden"
                id="manual-upload"
              />
              <label
                htmlFor="manual-upload"
                className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Upload File Manual
              </label>
              {manualData.length > 0 && (
                <p className="mt-3 text-green-600">
                  ✓ {manualData.length} data terupload
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Format: .xlsx, .xls, .csv
              </p>
            </div>
          </div>
          
          {/* QRPay Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              2. Deposit History (QRPay)
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleQRPayUpload}
                className="hidden"
                id="qrpay-upload"
              />
              <label
                htmlFor="qrpay-upload"
                className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Upload File QRPay
              </label>
              {qrpayData.length > 0 && (
                <p className="mt-3 text-green-600">
                  ✓ {qrpayData.length} data terupload
                </p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Format: .xlsx, .xls, .csv
              </p>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={filterDeposits}
            disabled={loading || manualData.length === 0 || qrpayData.length === 0}
            className={`px-6 py-2 rounded font-semibold ${
              loading || manualData.length === 0 || qrpayData.length === 0
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {loading ? 'Memproses...' : 'Filter Data'}
          </button>
          
          {filteredData.length > 0 && (
            <button
              onClick={downloadExcel}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-semibold"
            >
              Download Excel
            </button>
          )}
        </div>
        
        {/* Results Table */}
        {filteredData.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                Hasil Filter: {filteredData.length} user belum dapat bonus
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deposit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date/Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reference
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record['User Name']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {typeof record['Deposit'] === 'number' 
                          ? `Rp ${record['Deposit'].toLocaleString('id-ID')}`
                          : record['Deposit']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record['Date/Time']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">Informasi Filter:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Data Manual dengan kolom "To Bank" mengandung "BONUS DEPOSIT HARIAN" dianggap sudah mendapatkan bonus</li>
            <li>• Perbandingan dilakukan berdasarkan User Name dan Tanggal yang sama</li>
            <li>• Hanya menampilkan data QRPay yang belum mendapatkan bonus di tanggal yang sama</li>
            <li>• Mendukung file Excel (.xlsx, .xls) dan CSV</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
