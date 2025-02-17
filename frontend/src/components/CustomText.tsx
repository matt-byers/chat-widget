import React, { useEffect, useRef } from 'react';
import { useChatStore } from '../store/chatStore';
import { useContentStore } from '../store/contentStore';
import { CustomContentRequest, ContentGenerationResult } from '@chat-widget/utils';

export interface CustomTextProps {
  itemInformation: Record<string, any>;
  name: string;
  instructions: string;
  minCharacters: number;
  maxCharacters: number;
  textExamples?: string[];
  fallbackContent?: string;
  tone?: 'positive' | 'neutral' | 'factual' | 'fun';
  className?: string;
  style?: React.CSSProperties;
  updateOnIntentionChange?: boolean;
  strongMatchOnly?: boolean;
}

const CustomText: React.FC<CustomTextProps> = ({
  itemInformation,
  name,
  instructions,
  minCharacters,
  maxCharacters,
  tone,
  textExamples = [],
  fallbackContent,
  className,
  style,
  updateOnIntentionChange = true,
  strongMatchOnly = false,
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
    minCharacters,
    maxCharacters,
    tone,
    textExamples,
  });

  const generateContent = async () => {
    const currentState = useContentStore.getState().generatedContent[contentKey];
    if (currentState?.status === 'generating') {
      console.log('[CustomText] Generation already in progress for key:', contentKey.slice(0, 50));
      return;
    }

    // Mark as generating in the store.
    setStatusGenerating(contentKey);
    console.log('[CustomText] Starting content generation for key:', contentKey.slice(0, 50));

    console.log('in generateContent, generatedContent[contentKey].status:', generatedContent[contentKey]?.status);
    if (generatedContent[contentKey]?.status === 'generating') {
      console.log('[CustomText] Content generation already in progress for key:', contentKey.slice(0, 50));
      return;
    }

    if (!customerIntention.likes && !customerIntention.priorities) {
      console.warn('[CustomText] No customer intention - using fallback');
      setStatusError(contentKey);
      return;
    }

    try {
      const requestBody: CustomContentRequest = {
        itemInformation,
        customerIntention,
        name,
        instructions,
        minCharacters,
        maxCharacters,
        tone: tone || 'positive',
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
    <div className={className} style={style}>
      <button onClick={() => removeGeneratedContent(contentKey)}>Remove</button>
      {contentState?.status === 'generating' && (
        <div className="ai-sparkle-spinner">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray="31.4"
              strokeDashoffset="0">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 12 12"
                to="360 12 12"
                dur="1s"
                repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      )}

      {generatedContent[contentKey]?.status === 'generated' && (
        <>
          {generatedContent[contentKey].content}
        </>
      )}

      {(!generatedContent[contentKey] || generatedContent[contentKey]?.status === 'error') && fallbackContent && (
        <>
          {fallbackContent}
        </>
      )}
    </div>
  );
};

export default CustomText; 