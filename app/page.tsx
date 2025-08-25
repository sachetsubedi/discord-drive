"use client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import axios, { AxiosResponse } from "axios";
import {
  AlertCircle,
  CheckCircle,
  Database,
  File,
  LogOut,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { ChangeEvent, DragEvent, useRef, useState } from "react";

interface FileUpload {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  url?: string;
  error?: string;
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logout } = useAuth();

  const webhookURL = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL || "";

  const addFiles = (newFiles: File[]) => {
    const fileUploads: FileUpload[] = newFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...fileUploads]);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      addFiles(selectedFiles);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    // Reset file input to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (fileUpload: FileUpload) => {
    const formData = new FormData();
    formData.append(
      "payload_json",
      JSON.stringify({ content: `File upload: ${fileUpload.file.name}` })
    );
    formData.append("file", fileUpload.file);

    try {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id
            ? { ...f, status: "uploading" as const, progress: 0 }
            : f
        )
      );

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileUpload.id && f.status === "uploading"
              ? { ...f, progress: Math.min(f.progress + 10, 90) }
              : f
          )
        );
      }, 200);

      const response: AxiosResponse<{ attachments: { url: string }[] }> =
        await axios.post(webhookURL, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

      clearInterval(progressInterval);

      const discordUrl = response.data.attachments[0].url;

      // Save file data to database
      try {
        await axiosInstance.post("/api/files", {
          filename: fileUpload.file.name,
          originalName: fileUpload.file.name,
          fileSize: fileUpload.file.size,
          mimeType: fileUpload.file.type,
          discordUrl: discordUrl,
        });
      } catch (dbError) {
        console.error("Error saving to database:", dbError);
        // Continue even if database save fails
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id
            ? {
                ...f,
                status: "success" as const,
                progress: 100,
                url: discordUrl,
              }
            : f
        )
      );
    } catch (error: any) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileUpload.id
            ? {
                ...f,
                status: "error" as const,
                progress: 0,
                error: error.message || "Upload failed",
              }
            : f
        )
      );
    }
  };

  const uploadAllFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");
    for (const file of pendingFiles) {
      await uploadFile(file);
    }
  };

  const getStatusColor = (status: FileUpload["status"]) => {
    switch (status) {
      case "pending":
        return "bg-gray-500";
      case "uploading":
        return "bg-blue-500";
      case "success":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
    }
  };

  const getStatusIcon = (status: FileUpload["status"]) => {
    switch (status) {
      case "pending":
        return <File className="h-4 w-4" />;
      case "uploading":
        return <Upload className="h-4 w-4 animate-pulse" />;
      case "success":
        return <CheckCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-4xl font-bold text-gray-900">Discord Drive</h1>
            <p className="text-gray-600">
              Upload your files to Discord with ease
            </p>
            <div className="flex justify-center space-x-2 mt-4">
              <Link href="/files">
                <Button variant="outline" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  View All Files
                </Button>
              </Link>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Upload Area */}
        <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
          <CardContent className="p-8">
            <div
              className={`text-center space-y-4 ${
                isDragOver ? "bg-blue-50" : ""
              } rounded-lg p-6 transition-colors`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-700">
                  Drop files here or click to browse
                </h3>
                <p className="text-gray-500">
                  Support for images, documents, videos, and more
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="mt-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        {files.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Files ({files.length})</CardTitle>
              <div className="space-x-2">
                <Button
                  onClick={uploadAllFiles}
                  disabled={files.every((f) => f.status !== "pending")}
                  size="sm"
                >
                  Upload All
                </Button>
                <Button
                  onClick={() => {
                    setFiles([]);
                    // Reset file input to allow selecting the same files again
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {files.map((fileUpload) => (
                <div
                  key={fileUpload.id}
                  className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(fileUpload.status)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {fileUpload.file.name}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(
                          fileUpload.status
                        )} text-white`}
                      >
                        {fileUpload.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(fileUpload.file.size)}
                    </p>
                    {fileUpload.status === "uploading" && (
                      <Progress value={fileUpload.progress} className="mt-2" />
                    )}
                    {fileUpload.status === "error" && fileUpload.error && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {fileUpload.error}
                        </AlertDescription>
                      </Alert>
                    )}
                    {fileUpload.status === "success" && fileUpload.url && (
                      <div className="mt-2">
                        <a
                          href={fileUpload.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View uploaded file
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 space-x-2">
                    {fileUpload.status === "pending" && (
                      <Button
                        onClick={() => uploadFile(fileUpload)}
                        size="sm"
                        variant="outline"
                      >
                        Upload
                      </Button>
                    )}
                    <Button
                      onClick={() => removeFile(fileUpload.id)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Status */}
        {files.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No files selected yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
