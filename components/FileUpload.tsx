
import React, { useState, useCallback } from 'react';

interface FileUploadProps {
    onFileUpload: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
                onFileUpload(file);
            } else {
                alert('Please upload a valid .zip file.');
            }
            e.dataTransfer.clearData();
        }
    }, [onFileUpload]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileUpload(e.target.files[0]);
        }
    };

    const dragClasses = isDragging ? 'border-purple-500 bg-gray-800' : 'border-gray-600 hover:border-purple-400';

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`w-full max-w-2xl p-10 border-4 border-dashed rounded-lg text-center transition-all duration-300 ${dragClasses}`}
        >
            <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".zip"
                onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
                <div className="flex flex-col items-center">
                    <svg className="w-16 h-16 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="text-xl text-gray-400">
                        <span className="font-semibold text-purple-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">ZIP file containing frames and data.json</p>
                </div>
            </label>
        </div>
    );
};
