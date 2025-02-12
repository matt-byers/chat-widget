import { z } from 'zod';
import type OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { CustomContentRequest } from '@chat-widget/utils';

export class ContentGeneratorService {
  constructor(private openai: OpenAI) {}

  async generateContent(requestData: CustomContentRequest) {
    const { itemInformation, customerIntention, name, instructions, minCharacters, maxCharacters, textExamples = [] } = requestData;
    const { objective, budget, ...filteredIntention } = customerIntention;

    const PersonalizedContent = z.object({
      generatedContent: z.string().describe(`Generated content, must be between ${minCharacters} and ${maxCharacters} characters long.`),
      explanation: z.string().describe('In a few words, explain what customer attributes guided your generation. Clipped sentence. No more than 10 words.'),
      metadata: z.object({
        name: z.string().describe(`${name}`),
        customerIntentionUsed: z.array(z.string()).describe('Only list keys from the customerIntention object that contained information explicitly used to generate the content')
      })
    });

    const completion = await this.openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { 
          role: 'system', 
          content: `You are an AI assistant specialised in generating personalised content for a particular item.
            Rules and Constraints:
            - Strictly obey the min: ${minCharacters} and max: ${maxCharacters} character limits.
            - Do not copy the examples. Use them as a guide to understand the tone, style, and how to address the customer.`
        },
        {
          role: 'user',
          content: `
          This is the item information:
          ${JSON.stringify(itemInformation, null, 2)}
          
          This is the customer intention information: 
          ${JSON.stringify(filteredIntention, null, 2)}

          ${textExamples.length > 0 ? `
          These are examples of text shown in a similar context:
          ${textExamples.map((example) => `- ${example}`).join('\n')}
          ` : ''}

          Understanding the item information and customer intention, generate custom text with the following instructions:

          ${instructions}`
        }
      ],
      response_format: zodResponseFormat(PersonalizedContent, 'personalizedContent')
    });

    const result = completion.choices[0].message.parsed;
    if (!result) {
      throw new Error('Failed to parse completion result');
    }

    return {
      ...result,
      metadata: {
        ...result.metadata,
        characterCount: result.generatedContent.length
      }
    };
  }
} 