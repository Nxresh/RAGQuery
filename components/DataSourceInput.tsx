import React, { useState } from 'react';
import { FileIcon } from './icon/FileIcon';
import { LinkIcon } from './icon/LinkIcon';
import { TrashIcon } from './icon/TrashIcon';
import { FileUpload } from './FileUpload';

interface DataSourceInputProps {
  onFileChange: (file: File | null) => void;
  onUrlSubmit: (url: string) => void;
  onClear: () => void;
  fileName: string | null;
  isScraping: boolean;
}

export const DataSourceInput: React.FC<DataSourceInputProps> = ({ 
  onFileChange, 
  onUrlSubmit, 
  onClear, 
  fileName, 
  isScraping 
}) => {
  const [url, setUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url.trim());
    }
  };

  const handleClear = () => {
    setUrl('');
    onClear();
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-neutral-800">
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'file'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <FileIcon className="w-4 h-4 inline mr-2" />
          File
        </button>
        <button
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'url'
              ? 'text-orange-500 border-b-2 border-orange-500'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          URL
        </button>
      </div>

      {/* File Upload Tab */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <FileUpload onFileChange={onFileChange} />
          {fileName && (
            <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <FileIcon className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-neutral-300 truncate">{fileName}</span>
              </div>
              <button
                onClick={handleClear}
                className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                title="Remove file"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* URL Tab */}
      {activeTab === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-3">
          <div className="flex space-x-2">
            <label htmlFor="scrape-url" className="sr-only">URL to scrape</label>
            <input
              id="scrape-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              aria-label="URL to scrape"
              className="flex-1 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              disabled={isScraping}
            />
            <button
              type="submit"
              disabled={isScraping || !url.trim()}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {isScraping ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Scraping Content...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Scrape
                </>
              )}
            </button>
          </div>
          {fileName && (
            <div className="flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-lg">
              <div className="flex items-center space-x-2">
                <LinkIcon className="w-5 h-5 text-orange-500" />
                <span className="text-sm text-neutral-300 truncate">{fileName}</span>
              </div>
              <button
                onClick={handleClear}
                className="p-1 text-neutral-400 hover:text-red-400 transition-colors"
                title="Remove URL"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

