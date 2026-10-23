import { useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Hls from "hls.js";

export const CtaFooter = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const src = "https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8";

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      return () => hls.destroy();
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    }
  }, []);

  return (
    <section className="relative py-20 sm:py-28 md:py-32 px-4 sm:px-8 md:px-16 lg:px-24 text-center overflow-hidden bg-black text-white">
      {/* Background HLS Video */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0 opacity-70"
      />

      {/* Top fade */}
      <div
        className="absolute top-0 left-0 right-0 z-[1] pointer-events-none"
        style={{ height: '200px', background: 'linear-gradient(to bottom, black, transparent)' }}
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-[1] pointer-events-none"
        style={{ height: '200px', background: 'linear-gradient(to top, black, transparent)' }}
      />

      {/* Ambient Cobalt Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#1e3a8a] rounded-full blur-[140px] opacity-30 pointer-events-none z-[1]"
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <h2 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading italic text-white tracking-tight leading-[1.05] sm:leading-[0.88] max-w-3xl mx-auto mb-4">
          Your next vibecoded app starts securely.
        </h2>
        <p className="text-white/70 font-body font-light text-sm md:text-base max-w-xl mx-auto mb-8 leading-relaxed">
          Audit public surfaces, client assets, and leaked credentials in seconds. Catch cybersecurity flaws early and get targeted fix prompts for your AI builder.
        </p>

        {/* Action Button Row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 w-full max-w-md sm:max-w-none mx-auto">
          <button
            onClick={() => navigate('/workspace')}
            className="w-full sm:w-auto justify-center liquid-glass-strong rounded-full px-6 py-3 text-sm font-medium text-white flex items-center gap-2 hover:bg-white/10 transition-all font-body cursor-pointer shadow-lg"
          >
            Open Workspace
            <ArrowUpRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full sm:w-auto justify-center bg-white text-black rounded-full px-6 py-3 text-sm font-medium flex items-center gap-2 hover:bg-white/90 transition-colors font-body cursor-pointer shadow-lg"
          >
            View Pricing
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        {/* Minimal Footer Bar */}
        <div className="mt-16 sm:mt-24 md:mt-32 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="font-heading italic text-xl tracking-wide text-white">Sentinel</span>
            <p className="text-white/40 font-body font-light text-xs">
              &copy; 2026 Sentinel. Digital security companion for vibecoded apps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link
              to="/pricing"
              className="text-white/40 hover:text-white/80 font-body font-light text-xs transition-colors"
            >
              Pricing
            </Link>
            <Link
              to="/contact"
              className="text-white/40 hover:text-white/80 font-body font-light text-xs transition-colors"
            >
              Contact
            </Link>
            <Link
              to="/workspace/coverage"
              className="text-white/40 hover:text-white/80 font-body font-light text-xs transition-colors"
            >
              Scope
            </Link>
            <Link
              to="/workspace"
              className="text-white/40 hover:text-white/80 font-body font-light text-xs transition-colors"
            >
              Workspace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CtaFooter;
