import React, { useRef } from 'react';
import { UploadIcon } from './icon/UploadIcon';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onFileChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] || null;
    if (file) {
      onFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.pdf"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload a file (TXT, MD, or PDF)"
      />
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { fileInputRef.current?.click(); } }}
        role="button"
        tabIndex={0}
        className="border-2 border-dashed border-neutral-800 rounded-xl p-8 text-center hover:border-orange-500/50 transition-colors cursor-pointer"
      >
        <UploadIcon className="w-12 h-12 mx-auto mb-4 text-neutral-500" />
        <p className="text-sm text-neutral-400 mb-2">
          <span className="text-orange-500 font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-neutral-500">TXT, MD, or PDF files</p>
      </div>
    </>
  );
};

