import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@anam-ai/js-sdk';

interface AnamClientHook {
  isConnected: boolean;
  isLoading: boolean;
  isSendingMessage: boolean;
  error: string | null;
  connect: (videoElementId: string, personaConfig?: PersonaConfig) => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  sendImageContext: (imageDescription: string, userQuery?: string) => Promise<void>;
}

interface PersonaConfig {
  name?: string;
  avatarId?: string;
  voiceId?: string;
  llmId?: string;
  systemPrompt?: string;
}

export const useAnamClient = (): AnamClientHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientRef = useRef<any>(null);

  const getSessionToken = async (personaConfig?: PersonaConfig) => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/get-anam-token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ personaConfig }),
      }
    );

    if (!response.ok) {
      let errorMessage = 'Failed to get session token';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.sessionToken) {
      throw new Error('No session token received from server');
    }
    return data.sessionToken;
  };

  const connect = useCallback(async (videoElementId: string, personaConfig?: PersonaConfig) => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionToken = await getSessionToken(personaConfig);

      const client = createClient(sessionToken);
      await client.streamToVideoElement(videoElementId);

      clientRef.current = client;
      setIsConnected(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to Anam';
      setError(errorMessage);
      console.error('Anam connection error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.stopStreaming();
        clientRef.current = null;
      }
      setIsConnected(false);
      setError(null);
    } catch (err) {
      console.error('Anam disconnect error:', err);
    }
  }, []);

  const sendMessage = useCallback(async (message: string) => {
    if (!clientRef.current || !isConnected) return;

    try {
      setIsSendingMessage(true);
      await clientRef.current.sendUserMessage(message);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  }, [isConnected]);

  const sendImageContext = useCallback(async (imageDescription: string, userQuery?: string) => {
    if (!clientRef.current || !isConnected) return;

    try {
      setIsSendingMessage(true);
      const contextMessage = userQuery
        ? `Note to AI: The user has shared an image. Here's what the image contains: ${imageDescription}. The user asks: "${userQuery}"`
        : `Note to AI: The user has shared an image. Here's what the image contains: ${imageDescription}. Please acknowledge you've seen the image and offer to answer any questions about it.`;

      await clientRef.current.sendUserMessage(contextMessage);
    } catch (err) {
      console.error('Failed to send image context:', err);
    } finally {
      setIsSendingMessage(false);
    }
  }, [isConnected]);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.stopStreaming().catch(console.error);
      }
    };
  }, []);

  return {
    isConnected,
    isLoading,
    isSendingMessage,
    error,
    connect,
    disconnect,
    sendMessage,
    sendImageContext,
  };
};
