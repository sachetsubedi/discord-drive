"use client";
import Image from "next/image";
import { useState } from "react";

interface ImageWithLoaderProps {
    src: string;
    alt: string;
    className?: string;
    quality?: number;
    onClick?: () => void;
    priority?: boolean;
    width?: number;
    height?: number;
    fill?: boolean;
}

export default function ImageWithLoader({
    src,
    alt,
    className = "",
    quality = 30,
    onClick,
    priority = false,
    width,
    height,
    fill = false
}: ImageWithLoaderProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        console.error("Image failed to load:", src);
        setIsLoading(false);
        setHasError(true);
    };

    if (hasError) {
        return (
            <div className={`bg-gray-100 flex items-center justify-center ${className}`} style={fill ? {} : { width, height }}>
                <div className="text-gray-400 text-center">
                    <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs">Failed to load</p>
                </div>
            </div>
        );
    }

    return (
        <div className={fill ? "relative w-full h-full" : "relative inline-block"} style={fill ? {} : { width, height }}>
            {isLoading && (
                <div className={`${fill ? 'absolute inset-0' : 'absolute inset-0'} bg-gray-100 animate-pulse rounded`} />
            )}
            <Image
                src={src}
                alt={alt}
                fill={fill}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                className={`${fill ? 'object-cover' : 'object-cover rounded'} transition-all duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'
                    } ${className}`}
                quality={quality}
                loading={priority ? "eager" : "lazy"}
                onLoad={handleLoad}
                onError={handleError}
                onClick={onClick}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
        </div>
    );
}
