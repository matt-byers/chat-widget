import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useContentStore } from '../store/contentStore';
import { CustomContentRequest, ContentGenerationResult } from '@chat-widget/utils';
import './CustomText.scss';

export interface CustomTagProps {
  itemInformation: Record<string, any>;
  name: string;
  instructions: string;
  textExamples?: string[];
  updateOnIntentionChange?: boolean;
  strongMatchOnly?: boolean;
  backgroundColor?: string;
  borderColor?: string;
}

function isBackgroundColorDark(color: string): boolean {
  // Remove the leading # if present
  const hex = color.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Calculate relative luminance using sRGB coefficients
  // Using the formula from WCAG 2.0
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return true if the color is dark (luminance < 0.5)
  return luminance < 0.5;
}

const CustomTag: React.FC<CustomTagProps> = ({
  itemInformation,
  name,
  instructions,
  textExamples = [],
  updateOnIntentionChange = true,
  strongMatchOnly = false,
  backgroundColor = '#f0f0f0',
  borderColor,
}) => {
  const { customerIntention } = useChatStore();
  const {
    generatedContent,
    setContent,
    setStatusGenerating,
    setStatusError,
    removeGeneratedContent,
  } = useContentStore();
  const prevIntentRef = useRef<string>('');

  const contentKey = JSON.stringify({
    itemInformation,
    name,
    instructions,
    textExamples,
  });

  const generateContent = async () => {
    const currentState = useContentStore.getState().generatedContent[contentKey];
    if (currentState?.status === 'generating') {
      return;
    }

    setStatusGenerating(contentKey);

    if (generatedContent[contentKey]?.status === 'generating') {
      console.log('[CustomText] Content generation already in progress for key:', contentKey.slice(0, 50));
      return;
    }

    if (!customerIntention.likes && !customerIntention.priorities) {
      console.warn('[CustomText] No customer intention - cancelling generation');
      setStatusError(contentKey);
      return;
    }

    try {
      const requestBody: CustomContentRequest = {
        itemInformation,
        customerIntention,
        name,
        instructions,
        minCharacters: 35,
        maxCharacters: 40,
        textExamples,
        strongMatchOnly,
      };

      const res = await fetch('http://localhost:5001/api/generate-custom-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      console.log('[CustomText] API response status:', res.status);

      if (!res.ok) {
        const errorBody = await res.text();
        console.error('[CustomText] API error response:', errorBody);
        throw new Error(`API failed: ${res.status}`);
      }

      const data: ContentGenerationResult = await res.json();

      switch (data.scenario) {
        case 'noMatchRequired':
          console.log('[CustomText] No match required, setting content:', data.content);
          setContent(contentKey, data.content);
          break;

        case 'strongMatchSuccess':
          console.log('[CustomText] Strong match success, setting content:', data.content);
          setContent(contentKey, data.content);
          break;

        case 'strongMatchFailure':
          console.log('[CustomText] Strong match failure, setting error:', contentKey);
          setStatusError(contentKey);
          break;

        default:
          const _exhaustiveCheck: never = data;
          throw new Error(`Unhandled response scenario: ${(_exhaustiveCheck as any).scenario}`);
      }
    } catch (error) {
      console.error("[CustomText] Content generation failed:", error);
      setStatusError(contentKey);
    }
  };

  // Auto-update on intention changes
  useEffect(() => {
    if (updateOnIntentionChange) {
      const currentIntent = JSON.stringify({
        likes: customerIntention.likes,
        priorities: customerIntention.priorities,
        dislikes: customerIntention.dislikes,
      });

      if (prevIntentRef.current && prevIntentRef.current !== currentIntent) {
        console.log('[CustomText] Intention changed, regenerating content');
        generateContent();
      }
      prevIntentRef.current = currentIntent;
    }
  }, [customerIntention.likes, customerIntention.priorities, customerIntention.dislikes]);

  // Generate content on component mount if none in store
  useEffect(() => {
    console.log('[CustomText] Initial load check');
    console.log('generatedContent[contentKey]:', generatedContent[contentKey]);
    if (!generatedContent[contentKey] || generatedContent[contentKey].status === 'error') {
      console.log('[CustomText] No content found, generating');
      generateContent();
    }
  }, []);

  const contentState = generatedContent[contentKey];

  return (
    <div>
      <button onClick={() => removeGeneratedContent(contentKey)}>
        Remove
      </button>
      {contentState?.status === 'generated' && 
       contentState?.content && (
        <div 
          className="tag" 
          style={{
            backgroundColor,
            ...(borderColor && { borderColor }),
            color: isBackgroundColorDark(backgroundColor) ? '#ffffff' : '#000000'
          }}
        >
          <span>✨ {contentState.content}</span>
        </div>
      )}
    </div>
  );
};

export default CustomTag; 