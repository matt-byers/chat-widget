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

export interface SearchConfigSchema {
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
export function simplifySearchSchema(config: SearchConfigSchema) {
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
 * Defines the structure for content generation responses.
 * Three possible scenarios:
 * 1. noMatchRequired: Standard generation without match checking
 * 2. strongMatchSuccess: Match check passed, content generated
 * 3. strongMatchFailure: Match check failed, no content generated
 * 
 * Each scenario includes relevant metadata about the generation process.
 */
export type ContentGenerationResult = 
  | StandardGenerationResponse
  | StrongMatchSuccessResponse
  | StrongMatchFailureResponse;

export function hasAllRequiredFields(
  searchData: Record<string, any>, 
  searchConfig: SearchConfigSchema
): boolean {
  return Object.entries(searchConfig.searchData).every(([key, config]) => {
    if (config.required) {
      const value = searchData[key];
      return value !== undefined && value !== null && value !== '';
    }
    return true;
  });
} 