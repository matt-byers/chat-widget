import { z } from 'zod';
import type OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import type { CustomContentRequest, ContentGenerationResult, StrongMatchSuccessResponse, StandardGenerationResponse } from '@chat-widget/utils';

export class ContentGeneratorService {
  constructor(private openai: OpenAI) {}

  private readonly matchScoreThreshold = 0.65;

  /**
   * Analyzes how well an item matches customer preferences.
   * Returns a score between (0-1) to 4 decimal precision and match status based on the threshold.
   * 
   * Scoring process:
   * 1. Analyzes customer preferences and item details
   * 2. Generates a score (0-100) based on preference alignment
   * 3. Normalizes score to 0-1 range
   * 4. Determines match status using threshold (currently ${this.matchScoreThreshold})
   */
  private async checkStrongMatch(
    requestData: CustomContentRequest
  ): Promise<{ isMatch: boolean; score: number }> {
    try {
      const matchAnalysis = z.object({
        score: z.number().describe('Match score from 0-1 with 4 decimal precision, where 0 is no match and 1 is perfect match. Example output: 0.1243, 0.7685. Process: Analyze customer preferences thoroughly, identify key item characteristics, compare preferences against item details, weigh positive and negative correlations, calculate final score. Guidelines: Prioritize explicit preferences, consider both positive and negative correlations, be consistent across analyses, provide clear reasoning for score.')
      });

      const systemMessage = `You are an expert in match analysis and product recommendations.

# Role:
- Match Analysis Specialist
- Customer Preference Interpreter
- Product-Customer Fit Evaluator

# Input Data:
1. Customer Profile: Preferences, likes, and dislikes
2. Item Details: General information such as title, description, and characteristics

# Rules:
1. Score MUST be between 0-1 to 4 decimal precision. E.g. 0.1243, 0.7685.
2. Use a linear scale where:
   - 0 = No match whatsoever
   - 0.5 = Neutral/moderate match
   - 1 = Perfect match
3. Be precise - use decimals for fine-grained scoring
4. Consider ALL customer preferences equally
5. Base score purely on how well the item matches the customer's preferences
6. Be objective and consistent

# Process:
1. Analyze customer preferences thoroughly
2. Identify key item characteristics
3. Compare preferences against item details
4. Weigh positive and negative correlations
5. Calculate final score

# Guidelines:
- Prioritize explicit preferences
- Consider both positive and negative correlations
- Be consistent across different analyses
- Provide clear reasoning for score`;

      const userMessage = `
## Customer Preferences:
${JSON.stringify(requestData.customerIntention, null, 2)}

## Item Details:
${JSON.stringify(requestData.itemInformation, null, 2)}

Analyze the match between these customer preferences and item details and generate a precise score between 0 and 1 to 4 decimal precision. 

Output the score in the following format: 0.1243, 0.7685.`

      const completion = await this.openai.beta.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userMessage }
        ],
        response_format: zodResponseFormat(matchAnalysis, 'matchAnalysis'),
        temperature: 0
      });

      const result = completion.choices[0].message.parsed;
      if (!result || typeof result.score !== 'number') {
        throw new Error('Invalid match analysis response: missing or invalid score');
      }

      return { isMatch: result.score >= this.matchScoreThreshold, score: result.score };

    } catch (error) {
      console.error('[ContentGenerator] Match check failed:', error);
      throw new Error('Failed to check strong match');
    }
  }

  async generateContent(requestData: CustomContentRequest): Promise<ContentGenerationResult> {
    let matchScore: number | undefined;
    try {
      if (requestData.strongMatchOnly) {
        const { isMatch, score } = await this.checkStrongMatch(requestData);
        matchScore = score;
        if (!isMatch) {
          return {
            scenario: 'strongMatchFailure',
            metadata: {
              name: requestData.name,
              matchScore: score,
              matchScoreThreshold: this.matchScoreThreshold
            }
          };
        }
      }

      const { 
        itemInformation, 
        customerIntention, 
        name, 
        instructions, 
        minCharacters, 
        maxCharacters, 
        tone = 'positive',
        textExamples = []
      } = requestData;

      const { objective, budget, ...filteredIntention } = customerIntention;

      const PersonalizedContent = z.object({
        content: z.string().describe(`Generated content, must be between ${minCharacters} and ${maxCharacters} characters long.`),
        explanation: z.string().describe('In a few words, explain what customer attributes guided your generation. Clipped sentence. No more than 10 words.'),
        metadata: z.object({
          name: z.string().describe(`${name}`),
          customerIntentionUsed: z.array(z.string()).describe('Only list keys from the customerIntention object that contained information explicitly used to generate the content')
        })
      });

      const toneInstruction = {
        'positive': "Ensure the tone is very upbeat and positive.",
        'neutral': "Use a neutral and balanced tone.",
        'factual': "Focus on factual details with an objective tone.",
        'fun': "Adopt a playful and fun tone."
      }[tone];

      const systemMessage = `You are a professional content generator specializing in creating personalized content for a particular item on an online store or platform.
      Your task is to generate compelling text that communicates how an item's features meet or fulfill the customer's preferences.
      Understand that you will be creating many different pieces of content for different items, so try to be creatie when drawing connections to avoid repeating the same phrases throughout the application.

      # Role:
      - Personalized Content Specialist
      - Customer Preference Analyst
      - Tone and Style Adaptor

      # Input Data You'll Receive:
      1. Item Information: Detailed specs/features of the product/location
      2. Customer Intention: Key preferences and priorities from the customer's profile
      3. Content Parameters:
        - Name: ${name}
        - Target Length: ${minCharacters}-${maxCharacters} characters
        - Tone: ${tone} - ${toneInstruction}
        - Key Instruction: ${instructions}
        ${textExamples.length > 0 ? `
        - Style Examples:
        ${textExamples.map((ex, i) => `${i + 1}. "${ex}"`).join('\n')}
        ` : ''}
      
      # Content Creation Guidelines:
      - Mention appealing characteristics as early as possible in the generated content
      - Be specific when drawing connections between a particular user preference and the item details. For example, if the customer has a preference for "ancient architecture", and a location has ancient architecture, say something like "great ancient architecture" in the generated content.
      - Use synonymous terms, words, or phrases to the customer's preference when possible. This is to ensure that we don't repeat the same words throughout the website.

      # Rules:
      1. MUST stay strictly within ${minCharacters}-${maxCharacters} characters
      2. NEVER invent features - only use provided item information
      3. ALWAYS prioritize aspects that match customer intention and preferences
      4. NEVER use markdown or special formatting
      5. FOLLOW the tone and style instructions provided
      6. NEVER exactly copy the examples, use them as a guide
      7. AVOID using exact adjectives or phrases from the customer profile data. Instead, use synonymous terms, words, or phrases to avoid repeating the same words throughout the website. For example, if the customer says they like "stylish places", avoid describing things as "stylish" in the generated content, instead use something snyonymous like "good style" or "chic" or something else.

      # Process:
      1. Analyze item features and customer preferences
      2. Identify ways to highlight the way the item's features match the customer's preferences
      3. Understand the purpose of the content, the tone, and instructions
      4. Create content that sells how the item meets the customer's preferences`;

      const userMessage = `
      ## Item Details:
      ${JSON.stringify(itemInformation, null, 2)}

      ## Customer Profile:
      ${JSON.stringify(filteredIntention, null, 2)}

      ## Generation Task:
      Create personalized copy with the following instructions:
      ${instructions}.

      Remember, generated text must be between ${minCharacters} and ${maxCharacters} characters.`

      console.log('matchScore', matchScore, 'itemInformation.name:', itemInformation.name);

      const completion = await this.openai.beta.chat.completions.parse({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: systemMessage
          },
          {
            role: 'user',
            content: userMessage
          }
        ],
        response_format: zodResponseFormat(PersonalizedContent, 'personalizedContent')
      });
      
      const result = completion.choices[0].message.parsed;

      if (!result) {
        console.error('[ContentGenerator] Failed to parse OpenAI response');
        throw new Error('Failed to parse completion result');
      }
      if (requestData.strongMatchOnly) {
        return {
          scenario: 'strongMatchSuccess',
          content: result.content,
          explanation: result.explanation,
          metadata: {
            name: result.metadata.name,
            customerIntentionUsed: result.metadata.customerIntentionUsed,
            characterCount: result.content.length,
            matchScore: matchScore,
            matchScoreThreshold: this.matchScoreThreshold
          }
        } as StrongMatchSuccessResponse;
      }

      return {
        scenario: 'noMatchRequired',
        content: result.content,
        explanation: result.explanation,
        metadata: {
          name: result.metadata.name,
          customerIntentionUsed: result.metadata.customerIntentionUsed,
          characterCount: result.content.length
        }
      } as StandardGenerationResponse;

    } catch (error) {
      throw new Error('Failed to generate content');
    }
  }
} 