"use client";
import { Badge } from "@/components/ui/badge    const formatFileSize = (bytes: string) => {
const bytesNum = parseInt(bytes);
if (bytesNum === 0) return '0 Bytes';
const k = 1024;
const sizes = ['Bytes', 'KB', 'MB', 'GB'];
const i = Math.floor(Math.log(bytesNum) / Math.log(k));
return Math.round(bytesNum / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

const getFileType = (mimeType: string | null, filename: string) => {
    if (!mimeType) {
        // Fallback to file extension
        const ext = filename.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
        if (['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(ext || '')) return 'video';
        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext || '')) return 'audio';
        if (['pdf', 'doc', 'docx', 'txt'].includes(ext || '')) return 'document';
        if (['zip', 'rar', '7z', 'tar'].includes(ext || '')) return 'archive';
        return 'other';
    }

    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'archive';
    return 'other';
};

const getFileIcon = (type: string) => {
    switch (type) {
        case 'image': return <ImageIcon className="h-4 w-4" />;
        case 'video': return <Video className="h-4 w-4" />;
        case 'audio': return <Music className="h-4 w-4" />;
        case 'document': return <FileText className="h-4 w-4" />;
        case 'archive': return <Archive className="h-4 w-4" />;
        default: return <File className="h-4 w-4" />;
    }
};

const getFileTypeColor = (type: string) => {
    switch (type) {
        case 'image': return 'bg-green-100 text-green-800';
        case 'video': return 'bg-purple-100 text-purple-800';
        case 'audio': return 'bg-yellow-100 text-yellow-800';
        case 'document': return 'bg-blue-100 text-blue-800';
        case 'archive': return 'bg-orange-100 text-orange-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const isImage = (mimeType: string | null, filename: string) => {
    return getFileType(mimeType, filename) === 'image';
};

// Filtered and sorted files
const filteredAndSortedFiles = useMemo(() => {
    let filtered = files.filter(file => {
        const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.filename.toLowerCase().includes(searchTerm.toLowerCase());

        const fileType = getFileType(file.mimeType, file.filename);
        const matchesType = selectedFileType === 'all' || fileType === selectedFileType;

        return matchesSearch && matchesType;
    });

    // Sort files
    filtered.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
            case 'oldest':
                return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
            case 'name':
                return a.originalName.localeCompare(b.originalName);
            case 'size':
                return parseInt(b.fileSize) - parseInt(a.fileSize);
            default:
                return 0;
        }
    });

    return filtered;
}, [files, searchTerm, selectedFileType, sortBy]);

// Pagination
const totalPages = Math.ceil(filteredAndSortedFiles.length / itemsPerPage);
const paginatedFiles = filteredAndSortedFiles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
);

// Reset to first page when filters change
useEffect(() => {
    setCurrentPage(1);
}, [searchTerm, selectedFileType, sortBy]);t { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { Calendar, Download, Eye, File, Filter, Image as ImageIcon, LogOut, Search, Trash2, Video, Music, FileText, Archive } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";

interface StoredFile {
    id: string;
    filename: string;
    originalName: string;
    fileSize: string;
    mimeType: string | null;
    discordUrl: string;
    uploadedAt: string;
}

export default function FilesPage() {
    const [files, setFiles] = useState<StoredFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [fileToView, setFileToView] = useState<StoredFile | null>(null);

    // Pagination and filtering states
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFileType, setSelectedFileType] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    const itemsPerPage = 12;
    const { logout } = useAuth();

    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            const response = await axiosInstance.get('/api/files');
            setFiles(response.data);
        } catch (error) {
            console.error('Error fetching files:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatFileSize = (bytes: string) => {
        const bytesNum = parseInt(bytes);
        if (bytesNum === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytesNum) / Math.log(k));
        return parseFloat((bytesNum / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const downloadFile = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback to opening in new tab
            window.open(url, '_blank');
        }
    };

    const handleDeleteClick = (file: StoredFile) => {
        setFileToDelete(file);
        setDeleteDialogOpen(true);
    };

    const handleViewClick = (file: StoredFile) => {
        setFileToView(file);
        setViewDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!fileToDelete) return;

        setDeleting(true);
        try {
            await axiosInstance.delete(`/api/files?id=${fileToDelete.id}`);

            setFiles(prev => prev.filter(f => f.id !== fileToDelete.id));
            setDeleteDialogOpen(false);
            setFileToDelete(null);
        } catch (error) {
            console.error('Error deleting file:', error);
        } finally {
            setDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setFileToDelete(null);
    };

    const getFileTypeColor = (mimeType: string | null) => {
        if (!mimeType) return 'bg-gray-500';
        if (mimeType.startsWith('image/')) return 'bg-green-500';
        if (mimeType.startsWith('video/')) return 'bg-blue-500';
        if (mimeType.startsWith('audio/')) return 'bg-purple-500';
        if (mimeType.includes('pdf')) return 'bg-red-500';
        if (mimeType.includes('text/') || mimeType.includes('document')) return 'bg-yellow-500';
        return 'bg-gray-500';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">All Uploads</h1>
                        <p className="text-gray-600 mb-8">Loading your files...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">All Uploads</h1>
                        <p className="text-gray-600">Manage and view all your uploaded files</p>
                    </div>
                    <div className="flex space-x-2">
                        <Link href="/">
                            <Button variant="outline">
                                Back to Upload
                            </Button>
                        </Link>
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
                </div>

                {files.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12">
                            <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">No files uploaded yet</h3>
                            <p className="text-gray-500 mb-4">Start uploading files to see them here</p>
                            <Link href="/">
                                <Button>
                                    Upload Files
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Uploaded Files ({files.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {files.map((file) => (
                                    <Card key={file.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <File className="h-4 w-4 text-gray-500" />
                                                        <Badge
                                                            variant="secondary"
                                                            className={`${getFileTypeColor(file.mimeType)} text-white text-xs`}
                                                        >
                                                            {file.mimeType?.split('/')[0] || 'file'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex space-x-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            asChild
                                                            title="View file"
                                                        >
                                                            <a
                                                                href={file.discordUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                            </a>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => downloadFile(file.discordUrl, file.originalName)}
                                                            title="Download file"
                                                        >
                                                            <Download className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleDeleteClick(file)}
                                                            title="Delete file"
                                                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="font-semibold text-sm text-gray-900 truncate" title={file.originalName}>
                                                        {file.originalName}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 truncate" title={file.filename}>
                                                        {file.filename}
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span>{formatFileSize(file.fileSize)}</span>
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formatDate(file.uploadedAt)}</span>
                                                    </div>
                                                </div>

                                                {file.mimeType?.startsWith('image/') && (
                                                    <div className="mt-2">
                                                        <img
                                                            src={file.discordUrl}
                                                            alt={file.originalName}
                                                            className="w-full h-24 object-cover rounded border"
                                                            loading="lazy"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete File</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this file?
                            This action cannot be undone and will only remove the file from the database.
                            The file will still exist on Discord.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleDeleteCancel}
                            disabled={deleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            disabled={deleting}
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
