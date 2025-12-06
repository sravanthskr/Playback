export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${size} ${sizes[i]}`;
}

export function getVideoFormat(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  
  switch (extension) {
    case "mp4":
      return "video/mp4";
    case "webm":
      return "video/webm";
    case "ogg":
      return "video/ogg";
    case "mov":
      return "video/quicktime";
    case "avi":
      return "video/x-msvideo";
    case "mkv":
      return "video/x-matroska";
    case "flv":
      return "video/x-flv";
    case "wmv":
      return "video/x-ms-wmv";
    case "m4v":
      return "video/x-m4v";
    case "3gp":
      return "video/3gpp";
    default:
      return "video/mp4";
  }
}

export function isVideoFile(filename: string): boolean {
  const videoExtensions = ["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv", "wmv", "m4v", "3gp", "asf", "ts", "mts", "m2ts"];
  const extension = filename.split(".").pop()?.toLowerCase();
  return videoExtensions.includes(extension || "");
}

export function isSubtitleFile(filename: string): boolean {
  const subtitleExtensions = ["srt", "vtt", "ass", "ssa"];
  const extension = filename.split(".").pop()?.toLowerCase();
  return subtitleExtensions.includes(extension || "");
}
