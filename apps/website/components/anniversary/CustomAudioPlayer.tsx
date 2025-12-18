// src/components/anniversary/CustomAudioPlayer.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import { FaPause, FaPlay, FaVolumeMute, FaVolumeUp } from "react-icons/fa";

interface CustomAudioPlayerProps {
  src: string;
}

const formatTime = (time: number) => {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const CustomAudioPlayer = ({ src }: CustomAudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.75);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("loadeddata", setAudioData);
    audio.addEventListener("timeupdate", setAudioTime);

    return () => {
      audio.removeEventListener("loadeddata", setAudioData);
      audio.removeEventListener("timeupdate", setAudioTime);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgressChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(event.target.value);
    setCurrentTime(audio.currentTime);
  };

  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(event.target.value);
    setVolume(newVolume);
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex w-full items-center gap-4">
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
      />

      {/* Play/Pause Button */}
      <button
        onClick={togglePlayPause}
        className="hover:text-primary dark:hover:text-primary shrink-0 text-slate-500 transition-colors dark:text-slate-400"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} />}
      </button>

      {/* Progress Bar & Timestamps */}
      <div className="flex grow items-center gap-3">
        <span className="text-xs font-light text-slate-400 dark:text-slate-500">
          {formatTime(currentTime)}
        </span>
        <input
          type="range"
          min="0"
          max={duration}
          value={currentTime}
          onChange={handleProgressChange}
          className="accent-primary h-1 w-full grow cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700"
        />
        <span className="text-xs font-light text-slate-400 dark:text-slate-500">
          {formatTime(duration)}
        </span>
      </div>

      {/* Volume Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="hover:text-primary dark:hover:text-primary text-slate-500 transition-colors dark:text-slate-400"
        >
          {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="accent-primary h-1 w-20 cursor-pointer appearance-none rounded-full bg-slate-200 dark:bg-slate-700"
        />
      </div>
    </div>
  );
};
