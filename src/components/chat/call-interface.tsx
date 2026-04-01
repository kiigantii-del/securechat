'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  PhoneIncoming,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppStore } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { Call, CallType } from '@/lib/types';

const avatarColors = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-red-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function formatCallDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function CallInterface() {
  const {
    activeCall,
    incomingCall,
    setActiveCall,
    setIncomingCall,
    currentUser,
  } = useAppStore();

  const [callStatus, setCallStatus] = useState<'ringing' | 'connected' | 'ended'>('ringing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  const call = activeCall || incomingCall;
  const isIncoming = !!incomingCall && !activeCall;

  const getContactName = (): string => {
    if (!call) return 'Unknown';
    if (isIncoming) {
      return call.caller?.displayName || call.caller?.username || 'Unknown';
    }
    return call.receiver?.displayName || call.receiver?.username || 'Unknown';
  };

  const contactName = getContactName();
  const colorClass = getAvatarColor(contactName);

  // Start call duration timer
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Initialize media for call
  const initMedia = useCallback(async (callType: CallType) => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: callType === 'video',
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get media:', err);
      return null;
    }
  }, []);

  // Setup WebRTC peer connection
  const setupPeerConnection = useCallback((stream: MediaStream) => {
    const socket = getSocket();
    socketRef.current = socket;

    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(config);
    peerConnectionRef.current = pc;

    // Add local tracks
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0] || null);
    };

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && call) {
        socket.emit('ice-candidate', {
          callId: call.id,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Handle socket signals
    socket.on('offer-signal', async (data: { callId: string; signal: RTCSessionDescriptionInit }) => {
      if (data.callId === call?.id) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('answer-signal', { callId: data.callId, signal: answer });
      }
    });

    socket.on('answer-signal', async (data: { callId: string; signal: RTCSessionDescriptionInit }) => {
      if (data.callId === call?.id) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
      }
    });

    socket.on('ice-candidate', async (data: { callId: string; candidate: RTCIceCandidateInit }) => {
      if (data.callId === call?.id) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    return pc;
  }, [call]);

  // Handle incoming call - answer
  const handleAnswerCall = useCallback(async () => {
    if (!incomingCall || !currentUser) return;

    const stream = await initMedia(incomingCall.type);
    if (stream) {
      setupPeerConnection(stream);
    }

    const socket = getSocket();
    socket.emit('answer-call', { callId: incomingCall.id });

    setActiveCall(incomingCall);
    setIncomingCall(null);
    setCallStatus('connected');
    setIsVideoOn(incomingCall.type === 'video');
    startTimer();
  }, [incomingCall, currentUser, initMedia, setupPeerConnection, setActiveCall, setIncomingCall, startTimer]);

  // Handle incoming call - reject
  const handleRejectCall = useCallback(() => {
    if (!incomingCall) return;

    const socket = getSocket();
    socket.emit('reject-call', { callId: incomingCall.id });

    setIncomingCall(null);
  }, [incomingCall, setIncomingCall]);

  // End active call
  const handleEndCall = useCallback(() => {
    if (!call) return;

    const socket = getSocket();
    socket.emit('end-call', { callId: call.id });

    // Cleanup
    stopTimer();
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    setActiveCall(null);
    setIncomingCall(null);
    setCallStatus('ringing');
    setCallDuration(0);
  }, [call, localStream, stopTimer, setActiveCall, setIncomingCall]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsMuted((prev) => !prev);
  }, [localStream]);

  // Toggle speaker
  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
  }, []);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
    setIsVideoOn((prev) => !prev);
  }, [localStream]);

  // Handle outgoing call connected
  useEffect(() => {
    if (!activeCall) return;

    const socket = getSocket();
    socketRef.current = socket;

    const handleCallAnswered = async () => {
      setCallStatus('connected');
      startTimer();
    };

    const handleCallRejected = () => {
      setCallStatus('ended');
      setTimeout(() => {
        handleEndCall();
      }, 2000);
    };

    const handleCallEnded = () => {
      stopTimer();
      setCallStatus('ended');
      setTimeout(() => {
        handleEndCall();
      }, 2000);
    };

    socket.on('call-answered', handleCallAnswered);
    socket.on('call-rejected', handleCallRejected);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('call-answered', handleCallAnswered);
      socket.off('call-rejected', handleCallRejected);
      socket.off('call-ended', handleCallEnded);
      socket.off('offer-signal');
      socket.off('answer-signal');
      socket.off('ice-candidate');
    };
  }, [activeCall, startTimer, stopTimer, handleEndCall]);

  if (!call) return null;

  const isVideoCall = call.type === 'video';

  // Incoming call UI
  if (isIncoming) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center animate-in fade-in duration-300">
        {/* Background blur effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/20 to-gray-900/40" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Animated avatar */}
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
            <Avatar className="h-28 w-28 relative z-10 ring-4 ring-emerald-500/30">
              <AvatarFallback className={`${colorClass} text-white text-4xl font-bold`}>
                {contactName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Caller info */}
          <div className="text-center space-y-2">
            <h2 className="text-white text-2xl font-bold">{contactName}</h2>
            <div className="flex items-center justify-center gap-2 text-emerald-300">
              <PhoneIncoming className="h-4 w-4 animate-bounce" />
              <span className="text-sm font-medium">
                {isVideoCall ? 'Incoming Video Call' : 'Incoming Voice Call'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-8 mt-8">
            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={handleRejectCall}
                className="h-16 w-16 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40 p-0"
              >
                <PhoneOff className="h-7 w-7" />
              </Button>
              <span className="text-xs text-gray-300">Decline</span>
            </div>

            <div className="flex flex-col items-center gap-2">
              <Button
                onClick={handleAnswerCall}
                className="h-16 w-16 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/40 p-0"
              >
                <Phone className="h-7 w-7" />
              </Button>
              <span className="text-xs text-gray-300">Accept</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active call / Outgoing call UI
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col items-center justify-center animate-in fade-in duration-300">
      {/* Video stream (if video call and connected) */}
      {isVideoCall && callStatus === 'connected' && remoteStream && (
        <video
          ref={(el) => {
            if (el) el.srcObject = remoteStream;
          }}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* Local video (if video call) */}
      {isVideoCall && localStream && (
        <video
          ref={(el) => {
            if (el) el.srcObject = localStream;
          }}
          autoPlay
          playsInline
          muted
          className="absolute bottom-24 right-4 w-32 h-44 rounded-2xl object-cover z-20 ring-2 ring-white/20 shadow-xl"
        />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />

      <div className="relative z-20 flex flex-col items-center gap-6">
        {/* Animated avatar for voice / non-connected video */}
        {(!isVideoCall || callStatus !== 'connected') && (
          <div className="relative">
            {callStatus === 'ringing' && (
              <>
                <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" style={{ animationDuration: '2s' }} />
                <div className="absolute -inset-4 rounded-full bg-emerald-500/10 animate-pulse" />
              </>
            )}
            {callStatus === 'connected' && (
              <div className="absolute -inset-2 rounded-full bg-emerald-500/20 animate-pulse" />
            )}
            <Avatar className="h-32 w-32 relative z-10 ring-4 ring-white/10">
              <AvatarFallback className={`${colorClass} text-white text-5xl font-bold`}>
                {contactName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* Contact info */}
        <div className="text-center space-y-1">
          <h2 className="text-white text-2xl font-bold">{contactName}</h2>
          <p className="text-gray-300 text-sm font-medium">
            {callStatus === 'ringing' && 'Ringing...'}
            {callStatus === 'connected' && (
              <span className="flex items-center gap-2 justify-center">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                {formatCallDuration(callDuration)}
              </span>
            )}
            {callStatus === 'ended' && 'Call ended'}
          </p>
          <p className="text-gray-500 text-xs">
            {isVideoCall ? 'Video Call' : 'Voice Call'}
          </p>
        </div>
      </div>

      {/* Call controls */}
      <div className="absolute bottom-12 z-20 flex items-center gap-6">
        {/* Mute */}
        <div className="flex flex-col items-center gap-1.5">
          <Button
            onClick={toggleMute}
            variant="outline"
            size="icon"
            className={`h-14 w-14 rounded-full border-0 shadow-lg ${
              isMuted
                ? 'bg-white text-red-600 hover:bg-white hover:text-red-600'
                : 'bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'
            }`}
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          <span className="text-[10px] text-gray-400">
            {isMuted ? 'Unmute' : 'Mute'}
          </span>
        </div>

        {/* Speaker */}
        <div className="flex flex-col items-center gap-1.5">
          <Button
            onClick={toggleSpeaker}
            variant="outline"
            size="icon"
            className={`h-14 w-14 rounded-full border-0 shadow-lg ${
              isSpeakerOn
                ? 'bg-white text-emerald-600 hover:bg-white hover:text-emerald-600'
                : 'bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
          </Button>
          <span className="text-[10px] text-gray-400">
            {isSpeakerOn ? 'Speaker' : 'Speaker'}
          </span>
        </div>

        {/* Video toggle (only for video calls) */}
        {isVideoCall && (
          <div className="flex flex-col items-center gap-1.5">
            <Button
              onClick={toggleVideo}
              variant="outline"
              size="icon"
              className={`h-14 w-14 rounded-full border-0 shadow-lg ${
                isVideoOn
                  ? 'bg-white/10 text-white hover:bg-white/20 hover:text-white backdrop-blur-sm'
                  : 'bg-white text-red-600 hover:bg-white hover:text-red-600'
              }`}
            >
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>
            <span className="text-[10px] text-gray-400">
              {isVideoOn ? 'Video' : 'Video'}
            </span>
          </div>
        )}

        {/* End Call */}
        <div className="flex flex-col items-center gap-1.5 ml-4">
          <Button
            onClick={handleEndCall}
            className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/40 p-0"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
          <span className="text-[10px] text-gray-400">End</span>
        </div>
      </div>
    </div>
  );
}
