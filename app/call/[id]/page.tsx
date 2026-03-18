"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Call,
  CallControls,
  SpeakerLayout,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const callType = searchParams.get("type") === "audio" ? "audio" : "video";

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);

  useEffect(() => {
    if (!callId) {
      return;
    }

    let mounted = true;
    let activeClient: StreamVideoClient | null = null;
    let activeCall: Call | null = null;

    const initCall = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/signup");
        return;
      }

      const res = await fetch(`/api/stream-token?userId=${session.user.id}`);
      const { token } = await res.json();

      activeClient = new StreamVideoClient({
        apiKey,
        user: { id: session.user.id },
        token,
      });

      try {
        await navigator.mediaDevices.getUserMedia({
          video: callType === "video",
          audio: true,
        });
      } catch {
        alert(
          callType === "audio"
            ? "Please enable microphone access."
            : "Please enable camera and microphone access."
        );
        return;
      }

      activeCall = activeClient.call("default", callId);
      await activeCall.join({ create: true });
      if (callType === "audio") {
        await activeCall.camera.disable();
      }

      if (!mounted) {
        await activeCall.leave();
        await activeClient.disconnectUser();
        return;
      }

      setClient(activeClient);
      setCall(activeCall);
    };

    initCall();

    return () => {
      mounted = false;

      if (activeCall) {
        void activeCall.leave();
      }

      if (activeClient) {
        void activeClient.disconnectUser();
      }
    };
  }, [callId, callType, router, supabase]);

  if (!callId) {
    return <div className="p-10 text-center">Call ID is missing.</div>;
  }

  if (!client || !call) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-lg font-bold text-white">
        Opening {callType === "audio" ? "audio call" : "camera"}...
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <div className="relative h-screen bg-slate-900">
          <SpeakerLayout />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <CallControls onLeave={() => router.back()} />
          </div>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}