export type SearchFieldType = 'string' | 'number' | 'boolean' | 'integer' | 'object' | 'array' | 'enum';
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
export interface OpenAIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
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
export declare function simplifySearchSchema(config: SearchConfig): Record<string, {
    type: string;
    description: string;
}>;
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
export type ContentGenerationResult = StandardGenerationResponse | StrongMatchSuccessResponse | StrongMatchFailureResponse;
export {};
