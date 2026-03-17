"use client";

import { useEffect, useState } from "react";
import {
  StreamVideoClient,
  StreamVideo,
  StreamCall,
  SpeakerLayout,
  CallControls
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  // لو id جاي كـ array ناخد اول عنصر
  const callId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!callId) return;

    const initCall = async () => {
      // 1. جلب session من Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      // 2. جلب Stream Token من السيرفر
      const res = await fetch(`/api/stream-token?userId=${session.user.id}`);
      const { token } = await res.json();

      // 3. إنشاء Stream Client
      const _client = new StreamVideoClient({
        apiKey,
        user: { id: session.user.id },
        token
      });

      // 4. صلاحيات الكاميرا والمايكروفون
      try {
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch {
        alert("من فضلك فعّل الكاميرا والميكروفون!");
        return;
      }

      // 5. الانضمام أو إنشاء المكالمة
      const _call = _client.call("default", callId);
      await _call.join({ create: true });

      setClient(_client);
      setCall(_call);
    };

    initCall();

    return () => {
      if (call) call.leave();
      if (client) client.disconnectUser();
    };
  }, [callId, router, supabase]);

  if (!callId) return <div>Call ID غير موجود</div>;
  if (!client || !call)
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold">
        جاري فتح الكاميرا... 📹
      </div>
    );

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <div className="h-screen bg-slate-900 relative">
          <SpeakerLayout />
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <CallControls onLeave={() => router.back()} />
          </div>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}