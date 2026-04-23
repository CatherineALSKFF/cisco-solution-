"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface UploadZoneProps {
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadProgress: { fileName: string; status: string } | null;
}

export function UploadZone({ onUpload, isUploading, uploadProgress }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsExpanded(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf") || file.name.endsWith(".md") || file.name.endsWith(".txt"))) {
      await onUpload(file);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onUpload(file);
      e.target.value = "";
    }
  }, [onUpload]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => !isDragging && !isUploading && setIsExpanded(false)}
        className={`
          relative border-2 border-dashed rounded-lg transition-all duration-200 cursor-pointer
          ${isDragging
            ? "border-[var(--accent)] bg-[var(--accent-light)]"
            : "border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)]"
          }
          ${isExpanded || isUploading ? "py-8" : "py-4"}
        `}
      >
        <input
          type="file"
          accept=".pdf,.md,.txt"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />

        <AnimatePresence mode="wait">
          {isUploading && uploadProgress ? (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-4"
            >
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 animate-spin" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="3"
                  />
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="75 25"
                  />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {uploadProgress.status}
                </p>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  {uploadProgress.fileName}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2"
            >
              <div className={`flex items-center gap-3 ${isExpanded ? "" : ""}`}>
                <svg
                  className={`transition-all duration-200 ${isExpanded ? "w-8 h-8" : "w-5 h-5"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={isDragging ? "var(--accent)" : "var(--text-muted)"}
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                </svg>
                <div className="text-center">
                  <p className={`font-medium transition-all duration-200 ${
                    isDragging ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"
                  } ${isExpanded ? "text-sm" : "text-xs"}`}>
                    {isDragging ? "Drop to analyze" : "Drop contract PDF or click to upload"}
                  </p>
                  {isExpanded && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-[var(--text-muted)] mt-1"
                    >
                      Supports PDF, MD, TXT
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
