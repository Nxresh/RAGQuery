import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadGridProps {
    onFileUpload: (file: File, type: string) => void;
    onTextUpload: () => void;
    isProcessing: boolean;
}

// Icons as simple SVG components for better control
const PdfIcon = () => (
    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const ImageIcon = () => (
    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const AudioIcon = () => (
    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
);

const WebIcon = () => (
    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
);

const TextIcon = () => (
    <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

export const FileUploadGrid: React.FC<FileUploadGridProps> = ({
    onFileUpload,
    onTextUpload,
    isProcessing
}) => {
    const createDropzone = (accept: Record<string, string[]>, type: string, Icon: React.FC, label: string) => {
        const onDrop = useCallback((acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onFileUpload(acceptedFiles[0], type);
            }
        }, []);

        const { getRootProps, getInputProps, isDragActive } = useDropzone({
            onDrop,
            accept,
            multiple: false,
            disabled: isProcessing
        });

        return (
            <div
                {...getRootProps()}
                className={`relative group cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl p-2 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:scale-105 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-red-500/20 hover:border-orange-500/50 hover:text-orange-100 hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.5)] ${isDragActive ? 'bg-orange-500/30 scale-105 shadow-orange-500/40' : ''
                    } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center space-y-1">
                    <div className="p-2 rounded-full bg-neutral-800 group-hover:bg-neutral-800/80 transition-colors">
                        <Icon />
                    </div>
                    <div className="text-center">
                        <div className="font-medium text-xs text-neutral-200 group-hover:text-white transition-colors">{label}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full">
            <h3 className="text-xs font-semibold text-neutral-400 mb-2 text-center uppercase tracking-wider">
                Add Knowledge Source
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {/* PDF Upload */}
                {createDropzone(
                    { 'application/pdf': ['.pdf'] },
                    'pdf',
                    PdfIcon,
                    'PDF'
                )}

                {/* Image Upload (OCR) */}
                {createDropzone(
                    { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
                    'image',
                    ImageIcon,
                    'Image'
                )}

                {/* Audio Upload */}
                {createDropzone(
                    { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'] },
                    'audio',
                    AudioIcon,
                    'Audio'
                )}

                {/* Website (Manual) */}
                <div
                    onClick={() => !isProcessing && alert('Use the link input above to add websites')}
                    className={`relative group cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl p-2 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:scale-105 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-red-500/20 hover:border-orange-500/50 hover:text-orange-100 hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.5)] ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="p-2 rounded-full bg-neutral-800 group-hover:bg-neutral-800/80 transition-colors">
                            <WebIcon />
                        </div>
                        <div className="text-center">
                            <div className="font-medium text-xs text-neutral-200 group-hover:text-white transition-colors">Website</div>
                        </div>
                    </div>
                </div>

                {/* Text Input */}
                <div
                    onClick={() => !isProcessing && onTextUpload()}
                    className={`relative group cursor-pointer bg-neutral-900 border border-neutral-800 rounded-xl p-2 transition-all duration-300 shadow-[0_0_20px_-5px_rgba(249,115,22,0.3)] hover:scale-105 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-red-500/20 hover:border-orange-500/50 hover:text-orange-100 hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.5)] ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    <div className="flex flex-col items-center justify-center space-y-1">
                        <div className="p-2 rounded-full bg-neutral-800 group-hover:bg-neutral-800/80 transition-colors">
                            <TextIcon />
                        </div>
                        <div className="text-center">
                            <div className="font-medium text-xs text-neutral-200 group-hover:text-white transition-colors">Text</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
