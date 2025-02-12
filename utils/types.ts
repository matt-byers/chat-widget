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

// Content generation types
export interface CustomContentRequest {
  itemInformation: Record<string, any>;
  customerIntention: Record<string, any>;
  name: string;
  instructions: string;
  minCharacters: number;
  maxCharacters: number;
  textExamples?: string[];
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