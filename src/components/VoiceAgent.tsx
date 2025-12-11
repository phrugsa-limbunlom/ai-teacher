import { useState, useEffect, useRef } from 'react';
import { PhoneOff, Video, VideoOff, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { useAnamClient } from '../hooks/useAnamClient';
import { supabase } from '../lib/supabase';
import { analyzeImage } from '../lib/image-analysis';

export const VoiceAgent = () => {
  const { isConnected, isLoading, isSendingMessage, error, connect, disconnect, sendImageContext } = useAnamClient();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    createNewConversation();
  }, []);

  const createNewConversation = async () => {
    const { data } = await supabase
      .from('conversations')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000',
        title: 'Anam Voice Conversation',
      })
      .select()
      .maybeSingle();

    if (data) {
      setConversationId(data.id);
    }
  };

  const handleStartSession = async () => {
    if (!videoRef.current) return;

    setStatusMessage('Connecting to AI avatar...');
    setIsSessionActive(true);

    try {
      await connect('anam-video-element', {
        name: 'Alex',
        systemPrompt: 'You are a helpful and friendly AI assistant with vision capabilities. You can analyze images and provide clear, concise, and helpful responses to user questions.',
      });

      setStatusMessage('Connected! Start speaking...');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err) {
      setStatusMessage('Connection failed');
      setIsSessionActive(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleEndSession = async () => {
    setStatusMessage('Ending session...');
    await disconnect();
    setIsSessionActive(false);
    setStatusMessage('');
    removeImage();
    await createNewConversation();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendImage = async () => {
    if (!selectedImage || !imagePreview || !isConnected) return;

    setIsAnalyzingImage(true);
    setStatusMessage('Analyzing image...');

    try {
      const imageDescription = await analyzeImage(imagePreview);
      await sendImageContext(imageDescription);
      setStatusMessage('Image shared with AI');
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (err) {
      console.error('Failed to analyze image:', err);
      setStatusMessage('Failed to analyze image');
      setTimeout(() => setStatusMessage(''), 3000);
    } finally {
      setIsAnalyzingImage(false);
      removeImage();
    }
  };

  const getStatusText = () => {
    if (error) return `Error: ${error}`;
    if (!isSessionActive) return 'Start a session to begin';
    if (isLoading) return 'Connecting...';
    if (isAnalyzingImage) return 'Analyzing image...';
    if (isSendingMessage) return 'Sending to AI...';
    if (statusMessage) return statusMessage;
    if (isConnected) return 'Connected - Speak naturally';
    return 'Ready to connect';
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="w-full max-w-4xl">
        {/* Video Container */}
        <div className="relative mb-8 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
          <video
            id="anam-video-element"
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full aspect-video bg-slate-800 object-cover"
          />

          {!isConnected && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-800/90 backdrop-blur-sm">
              <div className="text-center">
                {isSessionActive ? (
                  <VideoOff className="w-20 h-20 text-slate-400 mx-auto mb-4" />
                ) : (
                  <Video className="w-20 h-20 text-slate-400 mx-auto mb-4" />
                )}
                <p className="text-white text-xl font-medium mb-2">
                  {isSessionActive ? 'Connecting...' : 'AI Avatar Ready'}
                </p>
                <p className="text-slate-400">
                  {isSessionActive ? 'Please wait' : 'Start a session to begin'}
                </p>
              </div>
            </div>
          )}

          {isConnected && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-green-500/20 backdrop-blur-sm px-4 py-2 rounded-full border border-green-500/30">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 font-medium text-sm">Live</span>
            </div>
          )}
        </div>

        {/* Status and Controls */}
        <div className="text-center mb-6">
          <p className="text-2xl font-medium text-white mb-2">{getStatusText()}</p>
          <p className="text-slate-400 text-sm">
            Powered by Anam AI - Natural voice and vision interaction
          </p>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-4 flex-wrap">
          {!isSessionActive ? (
            <button
              onClick={handleStartSession}
              disabled={isLoading}
              className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video className="w-6 h-6" />
              <span>Start Session</span>
            </button>
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-teal-500/30 cursor-pointer"
              >
                <ImageIcon className="w-6 h-6" />
                <span>Share Image</span>
              </label>
              <button
                onClick={handleEndSession}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium transition-all hover:scale-105 shadow-lg shadow-red-500/30"
              >
                <PhoneOff className="w-6 h-6" />
                <span>End Session</span>
              </button>
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm">
            <p className="text-red-400 text-center">
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-white/10">
            <div className="relative mb-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full max-h-80 object-contain rounded-xl"
              />
              <button
                onClick={removeImage}
                className="absolute -top-3 -right-3 bg-white text-slate-900 rounded-full p-2 hover:bg-slate-100 transition-all shadow-lg hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-slate-300 text-center mb-4">
              Share this image with the AI avatar?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={removeImage}
                className="px-6 py-3 rounded-full bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSendImage}
                disabled={isAnalyzingImage}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzingImage ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    <span>Share Image</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
