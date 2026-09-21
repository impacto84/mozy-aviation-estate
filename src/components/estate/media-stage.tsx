import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  image: string;
  video?: string;
  alt: string;
  className?: string;
  overlay?: string;
  parallax?: boolean;
};

export function MediaStage({
  image,
  video,
  alt,
  className,
  overlay = "from-void/70 via-void/30 to-void/80",
  parallax = true,
}: Props) {
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void videoEl.play().catch(() => {});
        } else {
          videoEl.pause();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(videoEl);
    return () => io.disconnect();
  }, [video]);

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !parallax) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const tween = gsap.fromTo(
      el,
      { yPercent: -8 },
      {
        yPercent: 8,
        ease: "none",
        scrollTrigger: {
          trigger: el.parentElement,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      },
    );
    return () => {
      tween.kill();
    };
  }, [parallax]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-navy", className)}>
      <div ref={mediaRef} className="parallax-media absolute inset-[-12%] scale-110">
        {video ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={image}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={alt}
          >
            <source src={video} type="video/mp4" />
          </video>
        ) : (
          <img src={image} alt={alt} className="h-full w-full object-cover" />
        )}
      </div>
      <div className={cn("absolute inset-0 bg-gradient-to-b", overlay)} />
    </div>
  );
}
