interface AIResponse {
  text: string;
  error?: string;
}

export const processWithAI = async (
  text: string,
  imageBase64?: string
): Promise<AIResponse> => {
  try {
    const messages: any[] = [];

    if (imageBase64) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: text || 'What do you see in this image?' },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64,
            },
          },
        ],
      });
    } else {
      messages.push({
        role: 'user',
        content: text,
      });
    }

    const response = {
      text: `I received your ${imageBase64 ? 'message with an image' : 'message'}: "${text}".

This is a demo response. To enable real AI processing with vision capabilities, you would need to integrate an AI API like OpenAI GPT-4 Vision, Google Gemini, or Anthropic Claude.

${imageBase64 ? 'I can see you uploaded an image, but I need an AI API key to analyze it.' : ''}

The voice agent is fully functional and ready to process your voice commands and images once you connect it to an AI service.`,
    };

    return response;
  } catch (error) {
    console.error('AI processing error:', error);
    return {
      text: '',
      error: 'Failed to process your request. Please try again.',
    };
  }
};

export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert image'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
