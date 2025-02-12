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
    textExamples?: string[];
}
export declare function simplifySearchSchema(config: SearchConfig): Record<string, {
    type: string;
    description: string;
}>;
