export interface CustomContentRequest {
  itemInformation: Record<string, any>;
  customerIntention: Record<string, any>;
  name: string;
  instructions: string;
  minCharacters: number;
  maxCharacters: number;
  textExamples?: string[];
} 