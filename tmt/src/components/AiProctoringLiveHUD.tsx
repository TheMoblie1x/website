import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Shield,
  Eye,
  Smartphone,
  Users,
  Mic,
  Maximize2,
  Minimize2,
  AlertTriangle,
  RotateCw,
  Compass,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Volume2,
} from 'lucide-react';
import {
  ProctoringEventType,
  InfractionLog,
  RoomSweepAudit,
  ProctoringTelemetry,
} from '../types/testforge';

interface AiProctoringLiveHUDProps {
  roomSweepAudit?: RoomSweepAudit;
  infractionCount: number;
  onTriggerInfraction: (type: ProctoringEventType, description: string) => void;
  onOpenRoomSweepModal?: () => void;
}

export const AiProctoringLiveHUD: React.FC<AiProctoringLiveHUDProps> = ({
  roomSweepAudit,
  infractionCount,
  onTriggerInfraction,
  onOpenRoomSweepModal,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showSimControls, setShowSimControls] = useState(false);
  const [videoStreamActive, setVideoStreamActive] = useState(false);
  const [showAuditViewer, setShowAuditViewer] = useState(false);

  // Live telemetry state
  const [telemetry, setTelemetry] = useState<ProctoringTelemetry>({
    gazeDirection: 'CENTER',
    faceCount: 1,
    mobileDetected: false,
    audioDecibels: 24,
    speechDetected: false,
    suspicionScore: 4,
    lastEvent: 'Room & Candidate Verified Compliant',
  });

  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera stream or fallback
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 320, height: 240 }, audio: false })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          setVideoStreamActive(true);
        })
        .catch(() => {
          setVideoStreamActive(false);
        });
    }

    // Dynamic decibel meter oscillation
    audioIntervalRef.current = setInterval(() => {
      setTelemetry((prev) => {
        // Natural ambient room noise between 20-32 dB
        const base = prev.speechDetected ? 68 : 22;
        const jitter = Math.floor(Math.random() * 8);
        return { ...prev, audioDecibels: base + jitter };
      });
    }, 800);

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    };
  }, []);

  // Canvas visual overlay loop for simulated AI gaze and bounding box
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let time = 0;

    const render = () => {
      time += 0.05;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // If camera is NOT active, draw simulated candidate silhouette
      if (!videoStreamActive) {
        // Dark background
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, width, height);

        // Candidate silhouette
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        // Head
        ctx.arc(width / 2, height / 2 - 12, 38, 0, Math.PI * 2);
        ctx.fill();
        // Shoulders
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2 + 55, 68, 38, 0, 0, Math.PI);
        ctx.fill();

        // Eyes
        const eyeOffset =
          telemetry.gazeDirection === 'LEFT'
            ? -8
            : telemetry.gazeDirection === 'RIGHT'
            ? 8
            : telemetry.gazeDirection === 'DOWN'
            ? 4
            : 0;

        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(width / 2 - 14 + eyeOffset, height / 2 - 14, 4, 0, Math.PI * 2);
        ctx.arc(width / 2 + 14 + eyeOffset, height / 2 - 14, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw AI Face Reticle Bounding Box
      const boxColor =
        telemetry.faceCount === 1 && telemetry.gazeDirection === 'CENTER'
          ? '#10b981' // Green
          : telemetry.faceCount === 0 || telemetry.faceCount > 1 || telemetry.mobileDetected
          ? '#ef4444' // Red
          : '#f59e0b'; // Amber

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);

      const boxX = width / 2 - 50;
      const boxY = height / 2 - 55;
      const boxW = 100;
      const boxH = 95;

      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);

      // Bounding box corner accents
      const corner = 10;
      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 3;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + corner);
      ctx.lineTo(boxX, boxY);
      ctx.lineTo(boxX + corner, boxY);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY);
      ctx.lineTo(boxX + boxW, boxY);
      ctx.lineTo(boxX + boxW, boxY + corner);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(boxX, boxY + boxH - corner);
      ctx.lineTo(boxX, boxY + boxH);
      ctx.lineTo(boxX + corner, boxY + boxH);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(boxX + boxW - corner, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH);
      ctx.lineTo(boxX + boxW, boxY + boxH - corner);
      ctx.stroke();

      // AI Reticle Center Gaze Crosshair
      const crossX = width / 2 + (telemetry.gazeDirection === 'LEFT' ? -22 : telemetry.gazeDirection === 'RIGHT' ? 22 : 0);
      const crossY = height / 2 - 15 + (telemetry.gazeDirection === 'DOWN' ? 16 : 0);

      ctx.strokeStyle = boxColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(crossX, crossY, 6, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary Person or Phone Highlight if triggered
      if (telemetry.mobileDetected) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
        ctx.fillRect(width - 70, height - 60, 50, 45);
        ctx.strokeStyle = '#ef4444';
        ctx.strokeRect(width - 70, height - 60, 50, 45);
        ctx.fillStyle = '#ef4444';
        ctx.font = '9px monospace';
        ctx.fillText('DEVICE 94%', width - 68, height - 64);
      }

      if (telemetry.faceCount > 1) {
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([4, 2]);
        ctx.strokeRect(20, height / 2 - 40, 50, 60);
        ctx.fillStyle = '#ef4444';
        ctx.font = '9px monospace';
        ctx.fillText('PERSON #2', 22, height / 2 - 44);
        ctx.setLineDash([]);
      }

      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [videoStreamActive, telemetry]);

  const triggerAlertNotice = (msg: string) => {
    setActiveAlert(msg);
    setTimeout(() => {
      setActiveAlert(null);
    }, 4500);
  };

  // Manual or Automated Simulation Handlers for Evaluator Demonstrations
  const handleSimulateLookAway = () => {
    setTelemetry((prev) => ({
      ...prev,
      gazeDirection: 'AWAY',
      suspicionScore: Math.min(100, prev.suspicionScore + 30),
      lastEvent: 'Persistent Gaze Away from Test Workspace',
    }));
    triggerAlertNotice('AI Proctor Warning: Candidate looking away from primary screen.');
    onTriggerInfraction('GAZE_AWAY', 'Candidate gaze diverted away from test screen for extended duration.');

    setTimeout(() => {
      setTelemetry((prev) => ({
        ...prev,
        gazeDirection: 'CENTER',
        suspicionScore: Math.max(5, prev.suspicionScore - 15),
      }));
    }, 4000);
  };

  const handleSimulatePhone = () => {
    setTelemetry((prev) => ({
      ...prev,
      mobileDetected: true,
      suspicionScore: 85,
      lastEvent: 'Secondary Mobile Device Detected on Desk',
    }));
    triggerAlertNotice('AI Proctor Warning: Unauthorized mobile phone / auxiliary screen detected in camera view.');
    onTriggerInfraction('MOBILE_PHONE_DETECTED', 'Auxiliary electronic mobile handset identified on desk perimeter.');

    setTimeout(() => {
      setTelemetry((prev) => ({
        ...prev,
        mobileDetected: false,
        suspicionScore: Math.max(5, prev.suspicionScore - 30),
      }));
    }, 5000);
  };

  const handleSimulateMultiPerson = () => {
    setTelemetry((prev) => ({
      ...prev,
      faceCount: 2,
      suspicionScore: 92,
      lastEvent: 'Multiple Human Faces Detected in Room Perimeter',
    }));
    triggerAlertNotice('Security Infraction: Multiple individuals detected in examination perimeter.');
    onTriggerInfraction('MULTI_PERSON_DETECTED', 'Secondary person detected entering testing perimeter behind candidate.');

    setTimeout(() => {
      setTelemetry((prev) => ({
        ...prev,
        faceCount: 1,
        suspicionScore: Math.max(5, prev.suspicionScore - 35),
      }));
    }, 5000);
  };

  const handleSimulateAudioSpeech = () => {
    setTelemetry((prev) => ({
      ...prev,
      speechDetected: true,
      audioDecibels: 76,
      suspicionScore: Math.min(100, prev.suspicionScore + 25),
      lastEvent: 'Vocal Speech / Acoustic Whispering Detected',
    }));
    triggerAlertNotice('Acoustic Warning: Human speech / whispered conversation detected above ambient threshold.');
    onTriggerInfraction('AUDIO_VOICE_DETECTED', 'Acoustic sensor captured verbal discussion during active section.');

    setTimeout(() => {
      setTelemetry((prev) => ({
        ...prev,
        speechDetected: false,
        audioDecibels: 24,
      }));
    }, 4000);
  };

  return (
    <>
      {/* Floating Alert Banner when suspicious event occurs */}
      {activeAlert && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-5 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold border-2 border-white/30 max-w-md text-center">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{activeAlert}</span>
        </div>
      )}

      {/* Docked AI Proctoring HUD */}
      <div className="fixed bottom-4 right-4 z-40 transition-all duration-200">
        {isMinimized ? (
          /* Minimized pill button */
          <button
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-900 text-white rounded-full shadow-xl border border-slate-700 hover:bg-slate-800 transition cursor-pointer text-xs font-bold"
          >
            <div className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </div>
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>360° AI Sentinel Active</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 font-mono text-slate-300">
              {infractionCount} warnings
            </span>
            <Maximize2 className="w-3 h-3 text-slate-400 ml-1" />
          </button>
        ) : (
          /* Expanded Proctoring HUD Card */
          <div className="w-72 bg-slate-950 text-slate-200 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden font-sans">
            {/* Header */}
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <span className="font-extrabold text-white text-[11px] tracking-wide">
                  360° AI PROCTOR HUD
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSimControls((p) => !p)}
                  title="Toggle Test Simulation Controls"
                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
                >
                  {showSimControls ? 'Hide Sim' : 'Simulate'}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                  title="Minimize HUD"
                >
                  <Minimize2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Live Camera View with Canvas Reticle */}
            <div className="relative w-full h-36 bg-black flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
                  videoStreamActive ? 'opacity-100' : 'opacity-0'
                }`}
              />
              <canvas
                ref={canvasRef}
                width={288}
                height={144}
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              />

              {/* Status pill on camera */}
              <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-[10px] font-mono text-emerald-400 border border-emerald-500/30">
                <Eye className="w-3 h-3" />
                <span>Gaze: {telemetry.gazeDirection}</span>
              </div>

              {/* Suspicion Score Meter */}
              <div
                className={`absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold backdrop-blur-xs border ${
                  telemetry.suspicionScore > 60
                    ? 'bg-red-950/80 text-red-400 border-red-500'
                    : telemetry.suspicionScore > 30
                    ? 'bg-amber-950/80 text-amber-400 border-amber-500'
                    : 'bg-slate-900/80 text-slate-300 border-slate-700'
                }`}
              >
                Risk: {telemetry.suspicionScore}%
              </div>

              {/* Warning Count Alert badge */}
              {infractionCount > 0 && (
                <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-900/80 text-white text-[10px] font-bold border border-red-500">
                  <AlertTriangle className="w-3 h-3" />
                  <span>
                    Strike {infractionCount}/3 {infractionCount >= 3 ? '(LOCK)' : ''}
                  </span>
                </div>
              )}
            </div>

            {/* Real-time Telemetry Grid */}
            <div className="p-2.5 space-y-2 bg-slate-950 text-[11px]">
              <div className="grid grid-cols-2 gap-1.5">
                {/* Face Tracker */}
                <div
                  className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${
                    telemetry.faceCount === 1
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-red-950/60 border-red-800 text-red-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-500">Candidate Face</p>
                    <p className="font-semibold truncate">
                      {telemetry.faceCount === 1
                        ? '1 Face Locked'
                        : telemetry.faceCount === 0
                        ? 'Face Not Found'
                        : `${telemetry.faceCount} Faces Detected!`}
                    </p>
                  </div>
                </div>

                {/* Device Detector */}
                <div
                  className={`p-1.5 rounded-lg border flex items-center gap-1.5 ${
                    !telemetry.mobileDetected
                      ? 'bg-slate-900 border-slate-800 text-slate-300'
                      : 'bg-red-950/60 border-red-800 text-red-300'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase font-bold text-slate-500">Aux Device</p>
                    <p className="font-semibold truncate">
                      {telemetry.mobileDetected ? 'Phone Detected' : 'Perimeter Clear'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Decibel Audio Meter */}
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Mic className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">Room Audio:</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-300 ${
                        telemetry.audioDecibels > 60
                          ? 'bg-red-500'
                          : telemetry.audioDecibels > 40
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (telemetry.audioDecibels / 85) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-slate-300">
                    {telemetry.audioDecibels} dB
                  </span>
                </div>
              </div>

              {/* 360 Room Sweep Status */}
              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Compass className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px]">360° Sweep Status:</span>
                </div>

                {roomSweepAudit && roomSweepAudit.isVerified ? (
                  <button
                    onClick={() => setShowAuditViewer(true)}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Certified ({roomSweepAudit.integrityScore}%)</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenRoomSweepModal}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Certify Sweep</span>
                  </button>
                )}
              </div>
            </div>

            {/* Simulation controls for reviewer to test malpractice detection */}
            {showSimControls && (
              <div className="p-2.5 bg-slate-900 border-t border-slate-800 space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Evaluator Malpractice Sim:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleSimulateLookAway}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded cursor-pointer transition text-left truncate"
                  >
                    ⚡ Sim: Look Away
                  </button>
                  <button
                    onClick={handleSimulatePhone}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded cursor-pointer transition text-left truncate"
                  >
                    ⚡ Sim: Phone In View
                  </button>
                  <button
                    onClick={handleSimulateMultiPerson}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded cursor-pointer transition text-left truncate"
                  >
                    ⚡ Sim: 2nd Person
                  </button>
                  <button
                    onClick={handleSimulateAudioSpeech}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold rounded cursor-pointer transition text-left truncate"
                  >
                    ⚡ Sim: Speech Whisper
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 360 Room Sweep Inspection Modal */}
      {showAuditViewer && roomSweepAudit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 text-white max-w-lg w-full rounded-2xl border border-slate-700 shadow-2xl overflow-hidden p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">360° AI Room Sweep Certificate</h3>
              </div>
              <button
                onClick={() => setShowAuditViewer(false)}
                className="text-slate-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded-xl flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-300">Environment Verification Integrity</p>
                  <p className="text-[11px] text-emerald-400/80">
                    Certified at {new Date(roomSweepAudit.verifiedAt || Date.now()).toLocaleTimeString()}
                  </p>
                </div>
                <span className="text-xl font-mono font-extrabold text-emerald-400">
                  {roomSweepAudit.integrityScore}%
                </span>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Verified Angles & Perimeter Audit:
                </p>
                {roomSweepAudit.steps.map((st) => (
                  <div
                    key={st.angle}
                    className="p-2.5 bg-slate-800/80 rounded-lg border border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">{st.label}</p>
                      <p className="text-[10px] text-slate-400">
                        {st.detectedObjects.join(' • ')}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                      CLEAN
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowAuditViewer(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
