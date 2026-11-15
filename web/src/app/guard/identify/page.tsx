"use client";

import { useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, XCircle, AlertCircle, User, RefreshCw } from "lucide-react";

type IdentifyResult = {
  action: "auto_entry" | "collect_info" | "escalate";
  trust_level: number;
  person_type: string;
  resident?: { id: string; name: string; flatNumber: string; building?: string };
  similarity?: number;
  entry_log_id?: string;
  photo_url?: string;
  message?: string;
  reason?: string;
};

export default function IdentifyPage() {
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraOn, setCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IdentifyResult | null>(null);
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
    setError("");
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch {
      setError("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  const captureAndIdentify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setLoading(true);
    setError("");

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) { setLoading(false); return; }

      const form = new FormData();
      form.append("photo", blob, "capture.jpg");
      if (session?.user.gateId) form.append("gateId", session.user.gateId);
      if (session?.user.id) form.append("guardId", session.user.id);

      try {
        const res = await fetch("/api/gate-ops/identify", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Identification failed");
        setResult(data);
        stopCamera();
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }, "image/jpeg", 0.9);
  }, [session, stopCamera]);

  const reset = () => { setResult(null); setError(""); };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Face Identification</h1>
        <p className="text-sm text-muted-foreground">Capture visitor's face to auto-identify</p>
      </div>

      {/* Camera Card */}
      {!result && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
              <video ref={videoRef} className={`w-full h-full object-cover ${cameraOn ? "" : "hidden"}`} muted playsInline />
              {!cameraOn && (
                <div className="text-center text-muted-foreground">
                  <Camera className="size-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Camera off</p>
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              {!cameraOn ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="size-4 mr-2" /> Start Camera
                </Button>
              ) : (
                <>
                  <Button onClick={captureAndIdentify} className="flex-1" disabled={loading}>
                    {loading ? <><RefreshCw className="size-4 mr-2 animate-spin" /> Identifying…</> : "📸 Capture & Identify"}
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>Cancel</Button>
                </>
              )}
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
          </CardContent>
        </Card>
      )}

      {/* Result Card */}
      {result && (
        <Card className={result.action === "auto_entry" ? "border-green-300" : result.action === "escalate" ? "border-yellow-300" : "border-orange-300"}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              {result.action === "auto_entry" ? (
                <CheckCircle className="size-5 text-green-600" />
              ) : result.action === "escalate" ? (
                <AlertCircle className="size-5 text-yellow-600" />
              ) : (
                <XCircle className="size-5 text-orange-600" />
              )}
              <CardTitle className="text-base">
                {result.action === "auto_entry" ? "Identity Confirmed" :
                 result.action === "escalate" ? "Escalation Required" : "Unknown Person"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.resident && (
              <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="size-4 text-muted-foreground" />
                  <p className="font-semibold">{result.resident.name}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {result.resident.building ? `${result.resident.building}, ` : ""}Flat {result.resident.flatNumber}
                </p>
              </div>
            )}

            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline">Type: {result.person_type}</Badge>
              <Badge variant="outline">Trust: {result.trust_level}/5</Badge>
              {result.similarity != null && (
                <Badge variant="outline">Match: {(result.similarity * 100).toFixed(1)}%</Badge>
              )}
            </div>

            {result.message && <p className="text-sm text-muted-foreground">{result.message}</p>}
            {result.reason && <p className="text-sm text-yellow-700">{result.reason}</p>}
            {result.entry_log_id && (
              <p className="text-xs text-green-700">✓ Entry logged automatically</p>
            )}

            <div className="flex gap-2 pt-2">
              {result.action === "collect_info" && (
                <Button
                  className="flex-1"
                  onClick={() => { window.location.href = "/guard/visitor"; }}
                >
                  Collect Visitor Info
                </Button>
              )}
              <Button variant="outline" onClick={reset} className="flex-1">
                Identify Another
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
