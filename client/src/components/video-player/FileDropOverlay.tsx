import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileVideo, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { VideoFile } from "@/types";

interface FileDropOverlayProps {
  onVideoAdd: (video: VideoFile) => void;
  onVideoSelect: (video: VideoFile) => void;
  hasVideo: boolean;
}

export default function FileDropOverlay({ 
  onVideoAdd, 
  onVideoSelect,
  hasVideo 
}: FileDropOverlayProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('video/') && 
        !file.name.match(/\.(mp4|mkv|avi|mov|webm|m4v|wmv|flv)$/i)) {
      toast({
        title: "Invalid file",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const videoFile: VideoFile = {
        id: Date.now(),
        filename: file.name,
        originalName: file.name,
        mimeType: file.type || 'video/mp4',
        size: file.size,
        duration: null,
        audioTracks: null,
        subtitleTracks: null,
        metadata: null,
        localUrl: URL.createObjectURL(file),
        file: file
      };

      onVideoAdd(videoFile);
      onVideoSelect(videoFile);
      
      toast({
        title: "Video loaded",
        description: file.name,
      });
    } catch (error) {
      toast({
        title: "Failed to load video",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  if (hasVideo) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black z-10"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mkv,.avi,.mov,.webm,.m4v,.wmv,.flv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={`
          relative flex flex-col items-center justify-center p-16 rounded-3xl
          border-2 border-dashed transition-all duration-300 cursor-pointer
          ${isDragOver 
            ? 'border-orange-500 bg-orange-500/10 scale-105' 
            : 'border-white/20 hover:border-white/40 bg-white/5'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Animated Background Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 animate-pulse" />

        {/* Icon */}
        <motion.div
          animate={{ 
            y: isDragOver ? -10 : 0,
            scale: isDragOver ? 1.1 : 1 
          }}
          transition={{ type: "spring", stiffness: 300 }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full" />
          <div className="relative p-6 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30">
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Film size={48} className="text-orange-400" />
              </motion.div>
            ) : (
              <FileVideo size={48} className="text-orange-400" />
            )}
          </div>
        </motion.div>

        {/* Text */}
        <motion.div 
          className="text-center"
          animate={{ opacity: isDragOver ? 0.8 : 1 }}
        >
          <h2 className="text-2xl font-semibold text-white mb-2">
            {isDragOver ? "Drop to play" : isLoading ? "Loading..." : "Drop your video here"}
          </h2>
          <p className="text-white/50 mb-6">
            or click to browse your files
          </p>
          <div className="flex items-center gap-3 text-white/30 text-sm">
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">MP4</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">MKV</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">AVI</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">MOV</span>
            <span className="px-2 py-1 rounded bg-white/5 border border-white/10">WebM</span>
          </div>
        </motion.div>

        {/* Upload Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-8 flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <Upload size={20} />
          Browse Files
        </motion.button>
      </motion.div>

      {/* Keyboard Shortcut Hint */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="absolute bottom-10 text-white/30 text-sm"
      >
        Supports drag & drop from your file explorer
      </motion.div>
    </motion.div>
  );
}
