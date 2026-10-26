import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, RefreshCw, File, FileText, Image as ImageIcon } from 'lucide-react';
import storageService from '../../services/storage.service';
import ProgressBar from './ProgressBar';
import Button from './Button';
import Spinner from './Spinner';

export const FileUploader = ({
  kind = 'image', // 'image' | 'pdf' | 'zip'
  label = 'Upload File',
  helperText,
  accept = 'image/png,image/jpeg',
  maxSize = 5 * 1024 * 1024, // 5MB default
  value, // storage key
  onChange, // callback with key or null
  className = '',
}) => {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedKey, setUploadedKey] = useState(value || null);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);

    // 1. Client-side Size Check
    if (file.size > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024));
      setError(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum allowed is ${maxMB}MB.`);
      return;
    }

    // 2. Client-side Type Check
    if (accept) {
      const acceptedTypes = accept.split(',').map((t) => t.trim().toLowerCase());
      const fileType = file.type.toLowerCase();
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;

      const isAllowed = acceptedTypes.some((pattern) => {
        if (pattern.startsWith('.')) {
          return pattern === fileExt;
        }
        if (pattern.endsWith('/*')) {
          return fileType.startsWith(pattern.slice(0, -2));
        }
        return fileType === pattern;
      });

      if (!isAllowed) {
        setError(`Invalid file type '${file.type || fileExt}'. Allowed: ${accept}`);
        return;
      }
    }

    // Begin upload
    await executeUpload(file);
  };

  const executeUpload = async (file) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Step A: Request presigned upload URL
      const { uploadUrl, key } = await storageService.presignUpload({
        kind,
        contentType: file.type || 'application/octet-stream',
        size: file.size,
        filename: file.name,
      });

      // Step B: Direct upload to Supabase Storage bucket via XHR with progress
      await storageService.uploadDirectToStorage(uploadUrl, file, (percent) => {
        setProgress(percent);
      });

      setUploadedKey(key);
      onChange?.(key);
    } catch (err) {
      setError(err.message || 'Direct file upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = () => {
    if (selectedFile) {
      executeUpload(selectedFile);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadedKey(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onChange?.(null);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <span className="text-xs font-semibold uppercase tracking-wider text-ink select-none block">
          {label}
        </span>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="sr-only"
        disabled={uploading}
      />

      {/* Upload Drop/Click Area when no file uploaded */}
      {!uploadedKey && !uploading && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`p-5 border border-dashed rounded-lg bg-surface hover:bg-surface-alt/60 transition-colors cursor-pointer text-center flex flex-col items-center justify-center gap-2 ${
            error ? 'border-danger/60 bg-danger-soft/20' : 'border-line'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-surface-alt border border-line flex items-center justify-center text-ink-muted">
            {kind === 'image' ? (
              <ImageIcon className="w-4 h-4 stroke-[1.5]" />
            ) : (
              <Upload className="w-4 h-4 stroke-[1.5]" />
            )}
          </div>

          <div className="text-xs">
            <span className="font-medium text-primary hover:underline">
              Click to select a file
            </span>{' '}
            <span className="text-ink-muted">from your device</span>
          </div>

          <span className="text-[11px] text-ink-muted">
            {helperText || `Max size: ${Math.round(maxSize / (1024 * 1024))}MB`}
          </span>
        </div>
      )}

      {/* Active Uploading State with Real Progress */}
      {uploading && (
        <div className="p-4 bg-surface border border-line rounded-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Spinner size="sm" className="text-primary shrink-0" />
              <span className="font-medium text-ink truncate">{selectedFile?.name}</span>
            </div>
            <span className="text-ink-muted font-mono tabular-nums shrink-0 ml-2">
              {progress}%
            </span>
          </div>

          <ProgressBar value={progress} max={100} />
          <span className="text-[11px] text-ink-muted block">
            Uploading directly to private cloud storage...
          </span>
        </div>
      )}

      {/* Successful Upload State */}
      {uploadedKey && !uploading && (
        <div className="p-3.5 bg-surface border border-success/30 rounded-lg flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-ink truncate">
                {selectedFile?.name || 'File attached'}
              </span>
              <span className="text-[11px] text-ink-muted">
                {selectedFile ? formatFileSize(selectedFile.size) : 'Uploaded successfully'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            className="p-1 text-ink-muted hover:text-danger rounded transition-colors shrink-0"
            aria-label="Remove uploaded file"
            title="Remove"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error State with Retry Button */}
      {error && !uploading && (
        <div className="p-3 bg-danger-soft border border-danger/30 rounded text-xs text-danger flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>

          {selectedFile && (
            <button
              type="button"
              onClick={handleRetry}
              className="font-semibold underline underline-offset-2 flex items-center gap-1 shrink-0 ml-2"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
