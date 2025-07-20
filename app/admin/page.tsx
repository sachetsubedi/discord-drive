"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import axiosInstance from "@/lib/axios";
import { Bot, Download, RefreshCw, Search, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface BotStatus {
    status: string;
    channelId: string;
    hasToken: boolean;
}

interface CrawlProgress {
    lastMessageId?: string;
    totalMessages: number;
    totalAttachments: number;
    isComplete: boolean;
    method?: string;
}

interface PermissionTest {
    botConnected: boolean;
    channelFound: boolean;
    canReadMessages: boolean;
    canReadHistory: boolean;
    botInGuild: boolean;
    errorDetails?: string;
    method?: string;
}

export default function AdminPage() {
    const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
    const [crawlProgress, setCrawlProgress] = useState<CrawlProgress | null>(null);
    const [permissionTest, setPermissionTest] = useState<PermissionTest | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        checkBotStatus();
    }, []);

    const checkBotStatus = async () => {
        try {
            const response = await axiosInstance.get('/api/discord-bot');
            setBotStatus(response.data);
        } catch (error) {
            console.error('Error checking bot status:', error);
            setError('Failed to check Discord bot status');
        }
    };

    const startCrawl = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use longer timeout for crawling (10 minutes)
            const response = await axiosInstance.post('/api/discord-bot', {
                action: 'crawl',
                resumeFromId: crawlProgress?.lastMessageId
            }, {
                timeout: 600000 // 10 minutes
            });
            setCrawlProgress(response.data);
        } catch (error) {
            console.error('Error starting crawl:', error);
            setError('Failed to start crawl operation');
        } finally {
            setLoading(false);
        }
    };

    const refreshUrls = async () => {
        setLoading(true);
        setError(null);
        try {
            // Use longer timeout for URL refresh (5 minutes)
            const response = await axiosInstance.post('/api/discord-bot', {
                action: 'refresh'
            }, {
                timeout: 300000 // 5 minutes
            });
            const method = response.data.method || 'HTTP API';
            alert(`Successfully refreshed ${response.data.refreshedCount} URLs via ${method}`);
        } catch (error) {
            console.error('Error refreshing URLs:', error);
            setError('Failed to refresh URLs');
        } finally {
            setLoading(false);
        }
    };

    const getStatus = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.post('/api/discord-bot', {
                action: 'status'
            });
            setCrawlProgress(response.data);
        } catch (error) {
            console.error('Error getting status:', error);
            setError('Failed to get crawl status');
        } finally {
            setLoading(false);
        }
    };

    const testPermissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.post('/api/discord-bot', {
                action: 'test-permissions'
            });
            setPermissionTest(response.data);
        } catch (error) {
            console.error('Error testing permissions:', error);
            setError('Failed to test bot permissions');
        } finally {
            setLoading(false);
        }
    };

    const validateToken = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.post('/api/discord-bot', {
                action: 'validate-token'
            });
            const method = response.data.method || 'HTTP API';
            alert(`Token validation successful via ${method}!\nBot: ${response.data.botInfo.username}#${response.data.botInfo.discriminator}\nID: ${response.data.botInfo.id}`);
        } catch (error) {
            console.error('Error validating token:', error);
            setError('Failed to validate Discord bot token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Discord Bot Admin</h1>
                        <p className="text-gray-600">Manage Discord message crawling and URL refresh</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.push('/files')}>
                            View Files
                        </Button>
                        <Button variant="outline" onClick={logout}>
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <p className="text-red-800">{error}</p>
                        </CardContent>
                    </Card>
                )}

                {/* Bot Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Discord Bot Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {botStatus ? (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span>Status:</span>
                                    <Badge variant={botStatus.hasToken ? "default" : "destructive"}>
                                        {botStatus.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Channel ID:</span>
                                    <code className="bg-gray-100 px-2 py-1 rounded">{botStatus.channelId}</code>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Bot Token:</span>
                                    <Badge variant={botStatus.hasToken ? "default" : "destructive"}>
                                        {botStatus.hasToken ? "Configured" : "Missing"}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <p>Loading bot status...</p>
                        )}
                    </CardContent>
                </Card>

                {/* Permission Test Results */}
                {permissionTest && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Bot Permissions Test
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span>Bot Connected:</span>
                                    <Badge variant={permissionTest.botConnected ? "default" : "destructive"}>
                                        {permissionTest.botConnected ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Channel Found:</span>
                                    <Badge variant={permissionTest.channelFound ? "default" : "destructive"}>
                                        {permissionTest.channelFound ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Bot in Guild:</span>
                                    <Badge variant={permissionTest.botInGuild ? "default" : "destructive"}>
                                        {permissionTest.botInGuild ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Can Read History:</span>
                                    <Badge variant={permissionTest.canReadHistory ? "default" : "destructive"}>
                                        {permissionTest.canReadHistory ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span>Can Read Messages:</span>
                                    <Badge variant={permissionTest.canReadMessages ? "default" : "destructive"}>
                                        {permissionTest.canReadMessages ? "Yes" : "No"}
                                    </Badge>
                                </div>
                                {permissionTest.method && (
                                    <div className="flex items-center gap-2">
                                        <span>Connection Method:</span>
                                        <Badge variant="secondary">
                                            {permissionTest.method}
                                        </Badge>
                                    </div>
                                )}
                                {permissionTest.errorDetails && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                                        <p className="text-red-800 text-sm">{permissionTest.errorDetails}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Crawl Progress */}
                {crawlProgress && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5" />
                                Crawl Progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div>Messages Processed: <strong>{crawlProgress.totalMessages}</strong></div>
                                <div>Attachments Found: <strong>{crawlProgress.totalAttachments}</strong></div>
                                <div>Status: <Badge variant={crawlProgress.isComplete ? "default" : "secondary"}>
                                    {crawlProgress.isComplete ? "Complete" : "In Progress"}
                                </Badge></div>
                                {crawlProgress.method && (
                                    <div className="flex items-center gap-2">
                                        <span>Method:</span>
                                        <Badge variant="secondary">
                                            {crawlProgress.method}
                                        </Badge>
                                    </div>
                                )}
                                {crawlProgress.lastMessageId && (
                                    <div>Last Message ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                        {crawlProgress.lastMessageId}
                                    </code></div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bot Operations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={validateToken}
                                disabled={loading}
                                variant="secondary"
                                className="flex items-center gap-2"
                            >
                                <Shield className="h-4 w-4" />
                                Validate Token
                            </Button>

                            <Button
                                onClick={testPermissions}
                                disabled={loading || !botStatus?.hasToken}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Shield className="h-4 w-4" />
                                Test Permissions
                            </Button>

                            <Button
                                onClick={startCrawl}
                                disabled={Boolean(loading || !botStatus?.hasToken || (permissionTest && !permissionTest.canReadMessages))}
                                className="flex items-center gap-2"
                            >
                                <Search className="h-4 w-4" />
                                {crawlProgress?.lastMessageId ? 'Resume Crawl' : 'Start Crawl'}
                            </Button>

                            <Button
                                onClick={refreshUrls}
                                disabled={loading || !botStatus?.hasToken}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh URLs
                            </Button>

                            <Button
                                onClick={getStatus}
                                disabled={loading}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Get Status
                            </Button>

                            <Button
                                onClick={checkBotStatus}
                                disabled={loading}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                <Bot className="h-4 w-4" />
                                Refresh Bot Status
                            </Button>
                        </div>

                        {loading && (
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                <p className="text-blue-800">Operation in progress... This may take several minutes.</p>
                                <p className="text-blue-600 text-sm mt-1">
                                    • Crawling operations can take 5-10 minutes for large channels<br />
                                    • URL refresh operations typically take 1-5 minutes<br />
                                    • Please keep this page open and wait for completion
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Setup Instructions</CardTitle>
                    </CardHeader>
                    <CardContent className="prose prose-sm">
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                            <p className="text-green-800 text-sm font-medium">✅ Now using Discord HTTP API for all operations</p>
                            <p className="text-green-700 text-xs">No WebSocket connection required - more reliable and firewall-friendly!</p>
                        </div>
                        <ol className="space-y-2">
                            <li>Create a Discord Bot in the Discord Developer Portal</li>
                            <li>Add the bot token to your <code>.env</code> file as <code>DISCORD_BOT_TOKEN</code></li>
                            <li>Invite the bot to your server with &quot;Read Message History&quot; permissions</li>
                            <li>Set the <code>DISCORD_CHANNEL_ID</code> in your <code>.env</code> file</li>
                            <li><strong>Use &quot;Test Permissions&quot; to verify the bot setup is correct</strong></li>
                            <li>Use &quot;Start Crawl&quot; to index all historical messages via HTTP API</li>
                            <li>Use &quot;Refresh URLs&quot; periodically to update expired Discord links</li>
                        </ol>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
