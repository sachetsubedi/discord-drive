"use client";
import FileCardSkeleton from "@/components/FileCardSkeleton";
import ImageWithLoader from "@/components/ImageWithLoader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { Archive, Calendar, Download, Eye, File, FileText, Filter, Image as ImageIcon, LogOut, Music, Search, Settings, Trash2, Video } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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

    // Auto-crawl state
    const [autoCrawlComplete, setAutoCrawlComplete] = useState(false);
    const [crawlStatus, setCrawlStatus] = useState<string>('');

    const itemsPerPage = 12;
    const { logout } = useAuth();

    useEffect(() => {
        fetchFiles();
        // Trigger auto-crawl when component mounts
        performAutoCrawl();
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

    const performAutoCrawl = async () => {
        try {
            setCrawlStatus('Checking for new files...');
            // First check if bot is configured
            const botStatusResponse = await axiosInstance.get('/api/discord-bot');
            if (!botStatusResponse.data.hasToken) {
                setCrawlStatus('Bot not configured');
                setAutoCrawlComplete(true);
                return;
            }

            // Perform crawl operation
            const crawlResponse = await axiosInstance.post('/api/discord-bot', {
                action: 'crawl'
            }, {
                timeout: 120000 // 2 minutes timeout for auto-crawl
            });

            if (crawlResponse.data.totalAttachments > 0) {
                setCrawlStatus(`Found ${crawlResponse.data.totalAttachments} new files`);
                // Refresh the files list after successful crawl
                setTimeout(() => {
                    fetchFiles();
                }, 1000);
            } else {
                setCrawlStatus('No new files found');
            }
        } catch (error) {
            console.error('Auto-crawl failed:', error);
            setCrawlStatus('Auto-crawl completed');
        } finally {
            setAutoCrawlComplete(true);
            // Clear status message after 3 seconds
            setTimeout(() => {
                setCrawlStatus('');
            }, 3000);
        }
    };

    const formatFileSize = (bytes: string) => {
        const bytesNum = parseInt(bytes);
        if (bytesNum === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytesNum) / Math.log(k));
        return Math.round(bytesNum / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
        const filtered = files.filter(file => {
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
    }, [searchTerm, selectedFileType, sortBy]);

    const downloadFile = async (file: StoredFile) => {
        try {
            // Use our enhanced download API with file ID for URL refresh capability
            const downloadUrl = `/api/download?fileId=${encodeURIComponent(file.id)}&filename=${encodeURIComponent(file.originalName)}`;

            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = file.originalName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Download failed:', error);
            // Fallback: try direct URL
            try {
                const fallbackUrl = `/api/download?url=${encodeURIComponent(file.discordUrl)}&filename=${encodeURIComponent(file.originalName)}`;
                window.open(fallbackUrl, '_blank');
            } catch (fallbackError) {
                console.error('Fallback download failed:', fallbackError);
                // Last resort: open Discord URL directly
                window.open(file.discordUrl, '_blank');
            }
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-6xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">All Uploads</h1>
                            <p className="text-gray-600">Loading your files...</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/">
                                <Button variant="outline">
                                    <File className="h-4 w-4 mr-2" />
                                    Upload Files
                                </Button>
                            </Link>
                            <Button variant="outline" onClick={logout}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>

                    {/* Loading Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <FileCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">All Uploads</h1>
                        <div className="flex items-center gap-3">
                            <p className="text-gray-600">
                                {filteredAndSortedFiles.length} file{filteredAndSortedFiles.length !== 1 ? 's' : ''} found
                            </p>
                            {!autoCrawlComplete && crawlStatus && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-blue-700 text-sm">
                                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                    {crawlStatus}
                                </div>
                            )}
                            {autoCrawlComplete && crawlStatus && (
                                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full text-green-700 text-sm">
                                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                                    {crawlStatus}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Link href="/admin">
                            <Button variant="outline">
                                <Settings className="h-4 w-4 mr-2" />
                                Admin
                            </Button>
                        </Link>
                        <Link href="/">
                            <Button variant="outline">
                                <File className="h-4 w-4 mr-2" />
                                Upload Files
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={logout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search files..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>

                            <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                                <SelectTrigger>
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue placeholder="File type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="image">Images</SelectItem>
                                    <SelectItem value="video">Videos</SelectItem>
                                    <SelectItem value="audio">Audio</SelectItem>
                                    <SelectItem value="document">Documents</SelectItem>
                                    <SelectItem value="archive">Archives</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest First</SelectItem>
                                    <SelectItem value="oldest">Oldest First</SelectItem>
                                    <SelectItem value="name">Name A-Z</SelectItem>
                                    <SelectItem value="size">Largest First</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="text-sm text-gray-600 flex items-center">
                                Showing {paginatedFiles.length} of {filteredAndSortedFiles.length}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Files Grid */}
                {paginatedFiles.length === 0 ? (
                    <Card>
                        <CardContent className="pt-6 text-center py-12">
                            <File className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No files found</h3>
                            <p className="text-gray-600 mb-4">
                                {searchTerm || selectedFileType !== 'all'
                                    ? 'Try adjusting your filters to see more files.'
                                    : 'Start by uploading some files to see them here.'
                                }
                            </p>
                            <Link href="/">
                                <Button>
                                    <File className="h-4 w-4 mr-2" />
                                    Upload Files
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {paginatedFiles.map((file) => {
                            const fileType = getFileType(file.mimeType, file.filename);
                            const isImageFile = isImage(file.mimeType, file.filename);

                            return (
                                <Card key={file.id} className="group hover:shadow-lg transition-shadow duration-200">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <Badge className={`${getFileTypeColor(fileType)} text-xs px-2 py-1`}>
                                                {getFileIcon(fileType)}
                                                <span className="ml-1 capitalize">{fileType}</span>
                                            </Badge>
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleViewClick(file)}
                                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => downloadFile(file)}
                                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(file)}
                                                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {/* Image Preview */}
                                        {isImageFile ? (
                                            <div className="relative aspect-video mb-3 overflow-hidden rounded-lg bg-gray-100">
                                                <ImageWithLoader
                                                    src={file.discordUrl}
                                                    alt={file.originalName}
                                                    className="transition-transform group-hover:scale-105 cursor-pointer"
                                                    quality={25}
                                                    onClick={() => handleViewClick(file)}
                                                    fill={true}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                                            </div>
                                        ) : (
                                            <div className="aspect-video mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <div className="text-gray-400 text-2xl">
                                                    {getFileIcon(fileType)}
                                                </div>
                                            </div>
                                        )}

                                        {/* File Info */}
                                        <div className="space-y-2">
                                            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
                                                {file.originalName}
                                            </h3>
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>{formatFileSize(file.fileSize)}</span>
                                                <div className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {formatDate(file.uploadedAt)}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>

                                {[...Array(totalPages)].map((_, index) => {
                                    const page = index + 1;
                                    if (
                                        page === 1 ||
                                        page === totalPages ||
                                        (page >= currentPage - 2 && page <= currentPage + 2)
                                    ) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationLink
                                                    onClick={() => setCurrentPage(page)}
                                                    isActive={currentPage === page}
                                                    className="cursor-pointer"
                                                >
                                                    {page}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    } else if (
                                        page === currentPage - 3 ||
                                        page === currentPage + 3
                                    ) {
                                        return (
                                            <PaginationItem key={page}>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                        );
                                    }
                                    return null;
                                })}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}

                {/* View Dialog */}
                <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                    <DialogContent className=" overflow-auto">
                        <DialogHeader>
                            <DialogTitle className="text-left">
                                {fileToView?.originalName}
                            </DialogTitle>
                            <DialogDescription className="text-left">
                                {fileToView && (
                                    <>
                                        <span>{formatFileSize(fileToView.fileSize)}</span>
                                        <span className="mx-2">•</span>
                                        <span>{formatDate(fileToView.uploadedAt)}</span>
                                        <span className="mx-2">•</span>
                                        <Badge className={getFileTypeColor(getFileType(fileToView.mimeType, fileToView.filename))}>
                                            {getFileType(fileToView.mimeType, fileToView.filename)}
                                        </Badge>
                                    </>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        {fileToView && (
                            <div className="mt-4">
                                {isImage(fileToView.mimeType, fileToView.filename) ? (
                                    <div className="relative w-full max-h-[60vh] overflow-hidden rounded-lg">
                                        <Image
                                            src={fileToView.discordUrl}
                                            alt={fileToView.originalName}
                                            width={1200}
                                            height={800}
                                            className="w-full h-auto object-contain"
                                            quality={95}
                                            priority
                                        />
                                    </div>
                                ) : fileToView.mimeType?.startsWith('video/') ? (
                                    <video
                                        src={fileToView.discordUrl}
                                        controls
                                        className="w-full max-h-[60vh] rounded-lg"
                                    >
                                        Your browser does not support video playback.
                                    </video>
                                ) : fileToView.mimeType?.startsWith('audio/') ? (
                                    <audio
                                        src={fileToView.discordUrl}
                                        controls
                                        className="w-full"
                                    >
                                        Your browser does not support audio playback.
                                    </audio>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-6xl text-gray-400 mb-4">
                                            {getFileIcon(getFileType(fileToView.mimeType, fileToView.filename))}
                                        </div>
                                        <p className="text-gray-600 mb-4">
                                            Preview not available for this file type.
                                        </p>
                                        <Button onClick={() => downloadFile(fileToView)}>
                                            <Download className="h-4 w-4 mr-2" />
                                            Download File
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                                Close
                            </Button>
                            {fileToView && (
                                <Button onClick={() => downloadFile(fileToView)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Dialog */}
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete File</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this file? The file will be hidden from your gallery and won&apos;t be re-added during future crawls.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleDeleteCancel}>
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

                {/* Auto-crawl Status */}
                {crawlStatus && (
                    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-md p-4 z-50">
                        <p className="text-sm text-gray-700">{crawlStatus}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
