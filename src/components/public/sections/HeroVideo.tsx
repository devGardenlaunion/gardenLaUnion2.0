"use client";

import { useRef, useEffect } from "react";

export default function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(video);

    const handleVisibility = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    // TODO poster: generar con: ffmpeg -i public/media/Hero/heroShort.webm -vframes 1 public/media/Hero/hero-poster.jpg
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      preload="none"
      poster="/media/Hero/hero-poster.jpg"
      aria-hidden="true"
      className="absolute inset-0 pt-4 w-full h-full object-cover hidden landscape:block md:block"
    >
      <source src="/media/Hero/heroShort.webm" type="video/webm" />
      {/* TODO mp4: generar con: ffmpeg -i public/media/Hero/heroShort.webm public/media/Hero/heroShort.mp4 */}
      <source src="/media/Hero/heroShort.mp4" type="video/mp4" />
    </video>
  );
}
