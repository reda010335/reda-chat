"use client";
import { useEffect, useState } from "react";
import { 
  StreamVideoClient, 
  StreamVideo, 
  StreamCall, 
  SpeakerLayout, 
  CallControls, 
  useCallStateHooks 
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY!;

export default function VideoCallPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params.id as string;
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const initCall = async () => {
      // 1. جلب بيانات المستخدم الحالي من سوبابيز
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push("/login");

      // 2. طلب الـ Token من الـ API اللي عملناه الخطوة اللي فاتت
      const res = await fetch(`/api/stream-token?userId=${session.user.id}`);
      const { token } = await res.json();

      // 3. إنشاء عميل الفيديو (Client)
      const _client = new StreamVideoClient({ 
        apiKey, 
        user: { id: session.user.id }, 
        token 
      });

      // 4. إنشاء أو الانضمام للمكالمة
      const _call = _client.call("default", callId);
      await _call.join({ create: true });

      setClient(_client);
      setCall(_call);
    };

    initCall();

    return () => {
      // تنظيف الاتصال لما تخرج من الصفحة
      call?.leave();
      client?.disconnectUser();
    };
  }, [callId]);

  if (!client || !call) return <div className="h-screen flex items-center justify-center bg-slate-900 text-white font-bold">جاري فتح الكاميرا... 📹</div>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <div className="h-screen bg-slate-900 relative">
          {/* عرض المشاركين في المكالمة */}
          <SpeakerLayout />
          
          {/* أزرار التحكم (قفل المايك، الكاميرا، الخروج) */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <CallControls onLeave={() => router.back()} />
          </div>
        </div>
      </StreamCall>
    </StreamVideo>
  );
}