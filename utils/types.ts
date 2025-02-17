// Search related types
export type SearchFieldType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'integer'
  | 'object'
  | 'array'
  | 'enum';

export interface SearchFieldConfig {
  type: SearchFieldType;
  description: string;
  required: boolean;
  format?: string;
  example?: any;
}

export interface SearchConfig {
  searchData: Record<string, SearchFieldConfig>;
}

// Message types
export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// TODO does it make sense to add a customerIntention interface?

// Content generation types
export interface CustomContentRequest {
  itemInformation: Record<string, any>;
  customerIntention: Record<string, any>;
  name: string;
  instructions: string;
  minCharacters: number;
  maxCharacters: number;
  tone?: 'positive' | 'neutral' | 'factual' | 'fun';
  textExamples?: string[];
  strongMatchOnly?: boolean;
}

// Helper function to simplify a search schema (used for constructing prompts)
export function simplifySearchSchema(config: SearchConfig) {
  return Object.entries(config.searchData).reduce(
    (
      acc: Record<string, { type: string; description: string }>, 
      [key, value]
    ) => {
      acc[key] = {
        type: value.type,
        description: value.description
      };
      return acc;
    },
    {}
  );
}

// Base interface with only required fields
interface BaseContentResponse {
  scenario: string;
  metadata: {
    name: string;
  };
}

/**
 * For when no strong-match check is requested
 */
export interface StandardGenerationResponse extends BaseContentResponse {
  scenario: 'noMatchRequired';
  content: string;
  explanation: string;
  metadata: {
    name: string;
    customerIntentionUsed: string[];
    characterCount: number;
  };
}

/**
 * For when strong match is requested and succeeds
 */
export interface StrongMatchSuccessResponse extends BaseContentResponse {
  scenario: 'strongMatchSuccess';
  content: string;
  explanation: string;
  metadata: {
    name: string;
    customerIntentionUsed: string[];
    characterCount: number;
    matchScore: number;
    matchScoreThreshold: number;
  };
}

/**
 * For when strong match is requested but fails
 */
export interface StrongMatchFailureResponse extends BaseContentResponse {
  scenario: 'strongMatchFailure';
  metadata: {
    name: string;
    matchScore: number;
    matchScoreThreshold: number;
  };
}

/**
 * Union of all possible responses
 */
export type ContentGenerationResult = 
  | StandardGenerationResponse
  | StrongMatchSuccessResponse
  | StrongMatchFailureResponse; 