export default function FileCardSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow-sm border animate-pulse">
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="flex gap-1">
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                </div>

                <div className="aspect-video bg-gray-200 rounded-lg mb-3"></div>

                <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
