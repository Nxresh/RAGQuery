import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, Music, Loader2 } from 'lucide-react';

interface StudioDropZoneProps {
    onFileUpload: (file: File, type: string) => void;
    isProcessing: boolean;
}

export const StudioDropZone = ({ onFileUpload, isProcessing }: StudioDropZoneProps) => {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            let type = 'pdf';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('audio/')) type = 'audio';

            onFileUpload(file, type);
        }
    }, [onFileUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
            'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
        },
        multiple: false,
        disabled: isProcessing
    });

    return (
        <div
            {...getRootProps()}
            className={`
                relative group cursor-pointer 
                border-2 border-dashed rounded-xl p-6
                transition-all duration-300
                flex flex-col items-center justify-center gap-3
                ${isDragActive
                    ? 'border-orange-500 bg-orange-500/10 scale-[1.02]'
                    : 'border-white/10 hover:border-orange-500/50 hover:bg-white/5'
                }
                ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <input {...getInputProps()} />

            {isProcessing ? (
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
            ) : (
                <div className="p-3 rounded-full bg-white/5 group-hover:bg-orange-500/20 transition-colors">
                    <Upload className={`w-6 h-6 ${isDragActive ? 'text-orange-500' : 'text-gray-400 group-hover:text-orange-500'}`} />
                </div>
            )}

            <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                    {isDragActive ? 'Drop source here' : 'Drag & drop source'}
                </p>
                <p className="text-xs text-gray-500">
                    PDF, Image, or Audio
                </p>
            </div>

            {/* File Type Indicators */}
            <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-50 transition-opacity">
                <FileText size={14} />
                <ImageIcon size={14} />
                <Music size={14} />
            </div>
        </div>
    );
};
