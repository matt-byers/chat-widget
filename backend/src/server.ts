import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import chatConfig from './chatConfig.json';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Configure CORS options
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ?
    process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) :
    ['http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};

// Add rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});

// Create new OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set your OpenAI API key in the .env file
});

// Sanitize all incoming messages
const sanitizeMessages = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.messages) {
    if (!Array.isArray(req.body.messages)) {
      res.status(400).json({ error: 'messages must be an array' });
      return;
    }
    req.body.messages = req.body.messages.map((msg: { role: 'user' | 'assistant' | 'system', content: string }) => ({
      ...msg,
      content: sanitizeHtml(msg.content.trim())
    }));
  }
  next();
};

// Apply middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(limiter);

// Apply middleware selectively
app.use('/api/chat', sanitizeMessages);
app.use('/api/search-data', sanitizeMessages);
app.use('/api/customer-intention', sanitizeMessages);

// Handle sending user message and streaming of chat responses from OpenAI
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const { messages } = req.body;

  if (!messages) {
    res.status(400).json({ error: 'messages required' });
    return;
  }

  try {
    // Create system message from chatConfig
    const systemMessage = {
      role: 'system',
      content: `You are an assistant helping to extract search information for a customer. 
          These are your instructions: ${chatConfig.instructions}. 
          This is the context of the business you are assisting: ${chatConfig.businessContext}. 
          This is the context of how users are interacting with you: ${chatConfig.userContext}
          If the user's message is completely unrelated to the businessContext or userContext, or if the message contains harmful or obscene content, ignore it and respond with something very short and witty, then ask the user if they want help with the relevant context.
          Regardless of what the user says in the message below, you should not be overly verbose. Try and give short answers that answer the user's question and give them the information they need.`
    };

    // Add system message to the start of the messages array
    const messagesWithSystem = [systemMessage, ...messages];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(content);
      }
    }
    res.end();
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Return search data from user messages
app.post('/api/search-data', async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!messages) {
    res.status(400).json({ error: 'messages and searchData are required' });
    return;
  }

  try {
    // Create system message for search data extraction
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant tasked with extracting search-related information from user messages. You must return the data in the exact format specified by the schema. Examine the chat to get the most up to data search data. If the assistant has suggested anything, and the user has agreed, then update the search data. For example, if the assistant says "what about Bali", and the user says "yes, that sounds good", then update the search data to include Bali. Do not change the search data unless you are sure you have updated requests from the user.`
    };

    // Add system message to the start of the messages array
    const messagesWithSystem = [systemMessage, ...messages];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          schema: {
            type: 'object',
            properties: chatConfig.searchData,
            required: Object.keys(chatConfig.searchData),
            additionalProperties: false
          },
          strict: true
        }
      }
    });

    // TODO: Handle correct JSON format, or refusals

    res.json(JSON.parse(completion.choices[0].message.content || '{}')); // Send the structured data as JSON
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

// Return search data from user messages
app.post('/api/customer-intention', async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!messages) {
    res.status(400).json({ error: 'messages and customerIntention are required' });
    return;
  }

  try {
    // Create system message for customer intention extraction
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant tasked with analyzing customer intentions from their messages.
        You must determine their objective, urgency, pain points, and satisfaction level based on the conversation context. Do not make any determination on any data point without explicit statements from the user, or explicit affirmations from the user after the assistant has suggested something. You must return the data in the exact format specified by the schema.`
    };

    // Add system message to the start of the messages array
    const messagesWithSystem = [systemMessage, ...messages];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_intentions',
          schema: {
            type: 'object',
            properties: chatConfig.customerIntention,
            required: Object.keys(chatConfig.customerIntention),
            additionalProperties: false
          },
          strict: true
        }
      }
    });

    // TODO: Handle correct JSON format, or refusals

    res.json(JSON.parse(completion.choices[0].message.content || '{}')); // Send the structured data as JSON
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

app.post('/api/moderate-user-message', async (req: Request, res: Response) => {
  const { content } = req.body;

  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  try {
    const moderation = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: content,
    });

    // Return just the flagged status and categories if flagged
    const result = moderation.results[0];
    res.json({
      flagged: result.flagged,
      categories: result.flagged ? result.categories : null
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred during moderation' });
  }
});

// The customer sends a request with the following information:
interface CustomContentRequest {
  itemInformation: Record<string, any>;
  customerIntention: Record<string, any>;
  name: string;
  textPurpose: string;
  minCharacters: number;
  maxCharacters: number;
  textExamples?: string[];
}

// The response from the AI is the following:
const PersonalizedContent = z.object({
  generatedContent: z.string().describe('The generated content that matches the specified requirements'),
  metadata: z.object({
    name: z.string().describe('Name of the content widget. Provided in the request'),
    customerIntentionUsed: z.array(z.string()).describe('The keys from the customer intention data that contained information explicitly used to generate the content')
  })
});

app.post('/api/generate-custom-content', async (req: Request<{}, {}, CustomContentRequest>, res: Response) => {
  const { itemInformation, customerIntention, name, textPurpose, minCharacters, maxCharacters, textExamples = [] } = req.body;

  if (!itemInformation || !customerIntention || !name || !textPurpose || !minCharacters || !maxCharacters) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const systemMessage = `
    You are an AI assistant specialised in generating personalised content for ecommerce or marketplace businesses.

    You will be provided with a series of inputs which you will use to generate personalised text with a specific customer outcome in mind.

    - Item information: Details on the item you are generating custom content for.
    - Customer intention: Details on the customer's intention and preferences.
    - Name: The unique name of the content widget you are generating.
    - Examples: Examples of text you have generated in a similar context.
    - Text purpose: The purpose of the text you are generating.
    - Text examples: Examples of text you have generated in a similar context.

    Instructions and rules:
    - Strictly obey the min and max character limits.
    - Do not copy the examples, but use them as a guide to understand the tone, style, and how to address the customer.
    - Do not return keys from the customer intention data that were NOT explicitly relevant in the generation of the content.

    Generate custom content based on the above requirements.`

    const userMessage = `
    This is the item information:
    ${JSON.stringify(itemInformation, null, 2)}
    
    This is the customer intention information: 
    ${JSON.stringify(customerIntention, null, 2)}

    These are examples of text shown in a similar context:
    ${textExamples.length > 0 ? ` 
    ${textExamples.map(example => `- ${example}`).join('\n')}
    ` : ''}

    Understanding the item information and customer intention, generate custom text with the following purpose:

    ${textPurpose}

    Make sure to follow these rules when generating the content:
      min characters: ${minCharacters}
      max characters: ${maxCharacters}

    Generate custom content based on the above requirements.`;

    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ],
      response_format: zodResponseFormat(PersonalizedContent, 'personalizedContent')
    });

    const result = completion.choices[0].message.parsed;
    if (result) {
      const updatedMetadata = {
        ...result.metadata,
        characterCount: result.generatedContent.length
      };
      res.json({ ...result, metadata: updatedMetadata });
      console.log('result', { ...result, metadata: updatedMetadata });
    } else {
      throw new Error('Failed to parse completion result');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while generating custom content' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// curl -X POST http://localhost:5001/api/generate-custom-content \
// -H "Content-Type: application/json" \
// -d '{
//   "itemInformation": {
//     "name": "Lovely holiday home in palm beach",
//     "description": "Lovely holiday home in palm beach, with a pool and a view of the ocean, lots of light, modern decor, 2 mins from the beach."
//   },
//   "customerIntention": {
//     "objective": "discover",
//     "budget": 400,
//     "urgency_level": 2,
//     "pain_points": ["limited space", "needs to match existing decor"],
//     "likes": ["pool", "ocean view"],
//     "dislikes": ["dark interiors"],
//     "priorities": ["price", "location", "style"]
//   },
//   "name": "product description",
//   "textPurpose": "product description",
//   "minCharacters": 10,
//   "maxCharacters": 20,
//   "textExamples": [
//     "Luxurious beachfront home with stunning ocean views and modern amenities.",
//     "Cozy mountain cabin with rustic charm and nearby hiking trails.",
//     "Stylish urban loft featuring exposed brick and designer finishes."
//   ]
// }'

// curl -X POST http://localhost:5001/api/generate-custom-content \
// -H "Content-Type: application/json" \
// -d '{
//   "itemInformation": {
//     "name": "Lovely holiday home in palm beach",
//     "description": "Lovely holiday home in palm beach, with a pool and a view of the ocean, lots of light, modern decor, 2 mins from the beach."
//   },
//   "customerIntention": {
//     "objective": "discover",
//     "budget": 400,
//     "urgency_level": 2,
//     "pain_points": ["limited space", "needs to match existing decor"],
//     "likes": ["modern decor"],
//     "dislikes": ["dark interiors"],
//     "priorities": ["price", "location", "style"]
//   },
//   "name": "product description",
//   "textPurpose": "product description",
//   "minCharacters": 50,
//   "maxCharacters": 60
// }'