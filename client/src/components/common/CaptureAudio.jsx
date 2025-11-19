"use client";
import React, { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaStop, FaTrash } from "react-icons/fa";
import { MdSend } from "react-icons/md";
import { useStateProvider } from "@/context/StateContext";
import axios from "axios";
import { ADD_AUDIO_ROUTE } from "@/utils/ApiRoutes";
import { reducerCases } from "@/context/constants";

function CaptureAudio({ onChange, hide }) {
  const [{ userInfo, currentChatUser, socket, messages }, dispatch] = useStateProvider();

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);
  const timerRef = useRef(null);

  const close = () => {
    if (onChange) onChange(false);
    if (hide) hide();
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => setRecordingDuration((d) => d + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const handleStartRecording = async () => {
    if (!navigator?.mediaDevices?.getUserMedia) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        stopTimer();
      };
      mediaRecorderRef.current = mr;
      setRecordingDuration(0);
      setRecordedBlob(null);
      setIsRecording(true);
      mr.start();
      startTimer();
    } catch (err) {
      console.error("Audio getUserMedia error", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handlePlayRecording = () => {
    if (!recordedBlob) return;
    const url = URL.createObjectURL(recordedBlob);
    const audio = audioRef.current;
    audio.src = url;
    audio.onended = () => setIsPlaying(false);
    setIsPlaying(true);
    audio.play();
  };

  const handleSendRecording = async () => {
    try {
      if (!recordedBlob || !userInfo?.id || !currentChatUser?.id) return;
      const form = new FormData();
      form.append("audio", recordedBlob, "recording.webm");
      form.append("from", String(userInfo.id));
      form.append("to", String(currentChatUser.id));
      const { data } = await axios.post(ADD_AUDIO_ROUTE, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      socket.current?.emit("send-msg", {
        to: currentChatUser.id,
        from: userInfo.id,
        message: data.content,
        type: "audio",
      });
      dispatch({
        type: reducerCases.SET_MESSAGES,
        messages: [...(messages || []), data],
      });
      close();
    } catch (err) {
      console.error("sendAudio error", err);
    }
  };

  return (
    <div className="flex text-2xl w-full justify-end items-center">
      <audio ref={audioRef} hidden />
      <div className="pt-1">
        <FaTrash className="text-panel-header-icon" onClick={close} />
      </div>
      <div className="mx-4 py-2 px-4 text-white text-lg flex gap-4 justify-center items-center bg-search-input-container-background rounded-full drop-shadow-lg">
        {isRecording ? (
          <div className="text-red-500 animate-pulse w-48 text-center">
            Recording <span>{recordingDuration}s</span>
          </div>
        ) : (
          <div className="w-48 text-center">
            {recordedBlob && (
              <button className="text-sm text-primary-strong" onClick={handlePlayRecording}>
                {isPlaying ? "Playing..." : "Play recording"}
              </button>
            )}
          </div>
        )}

        <div className="mr-2">
          {!isRecording ? (
            <FaMicrophone className="text-red-500 hover:cursor-pointer" onClick={handleStartRecording} />
          ) : (
            <FaStop className="text-red-500 hover:cursor-pointer" onClick={handleStopRecording} />
          )}
        </div>
        <div className="mr-1">
          <MdSend className="hover:cursor-pointer" onClick={handleSendRecording} />
        </div>
      </div>
    </div>
  );
}

export default CaptureAudio;
