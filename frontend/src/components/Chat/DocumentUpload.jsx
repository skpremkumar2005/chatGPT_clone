import React, { useState } from "react";
import { DocumentArrowUpIcon, XMarkIcon } from "@heroicons/react/24/outline";
import axios from "axios";

const DocumentUpload = ({ chatId, onDocumentProcessed, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [action, setAction] = useState("summarize");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !chatId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("action", action);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/chats/${chatId}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true, // Include cookies in the request
        },
      );

      if (response.data.success) {
        onDocumentProcessed(response.data.data);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error("Document upload failed:", error);
      const errorMsg =
        error.response?.data?.message ||
        "Failed to process document. Please try again.";
      alert(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
  };

  return (
    <div className="p-6 bg-black border-t border-zinc-800">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">
            Attach Document
          </h3>
          <button
            onClick={onCancel}
            className="p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <XMarkIcon className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? "border-cyan-500 bg-cyan-500/5"
              : "border-zinc-800 hover:border-zinc-700"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <>
              <DocumentArrowUpIcon className="h-12 w-12 mx-auto text-zinc-600 mb-3" />
              <p className="text-zinc-400 mb-3 text-sm">
                Drag and drop, or click to browse
              </p>
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.txt"
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm rounded-lg cursor-pointer transition-all border border-zinc-800"
              >
                Choose File
              </label>
              <p className="text-xs text-zinc-600 mt-3">
                PDF, DOC, DOCX, TXT • Max 10MB
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 rounded">
                    <DocumentArrowUpIcon className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearFile}
                  className="p-1.5 hover:bg-zinc-900 rounded transition-colors"
                  disabled={isUploading}
                >
                  <XMarkIcon className="h-4 w-4 text-zinc-500 hover:text-white" />
                </button>
              </div>

              <div className="space-y-2 text-left">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Action
                </label>
                <select
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="w-full bg-zinc-950 text-white text-sm border border-zinc-800 rounded-lg px-3 py-2 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  disabled={isUploading}
                >
                  <option value="summarize">Summarize</option>
                  <option value="extract">Extract Keywords</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={onCancel}
                  disabled={isUploading}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors border border-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isUploading
                      ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                      : "bg-cyan-500 hover:bg-cyan-400 text-white"
                  }`}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    "Upload"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentUpload;
