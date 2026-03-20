'use client';

interface FileUploaderProps {
  title: string;
  icon: string;
  accept: string;
  onUpload: (file: File) => void;
  fileName?: string;
  dataCount?: number;
}

export default function FileUploader({ title, icon, accept, onUpload, fileName, dataCount }: FileUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <span className="text-2xl mr-2">{icon}</span>
        {title}
      </h2>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer"
           onClick={() => document.getElementById(`upload-${title}`)?.click()}>
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          id={`upload-${title}`}
        />
        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <p className="text-gray-600">Klik untuk upload file</p>
          <p className="text-sm text-gray-400">Format: {accept}</p>
          {fileName && (
            <p className="text-green-600 text-sm mt-2">
              ✓ {fileName} ({dataCount} data)
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
