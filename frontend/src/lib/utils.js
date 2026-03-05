import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge tailwind classes
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Get TMDB image URL
 */
export function getImageUrl(path, size = "w500") {
    if (!path) return "/placeholder-poster.png";
    if (path.startsWith("http")) return path;
    return `https://image.tmdb.org/t/p/${size}${path}`;
}

/**
 * Format date to a readable string
 */
export function formatDate(dateString) {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
}
