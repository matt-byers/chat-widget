import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import chatConfig from './chatConfig.json';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { ContentGeneratorService } from './services/contentGenerator';
import { zodResponseFormat } from 'openai/helpers/zod';
import { CustomerIntentionSchema, CustomerProspectSchema } from './schemas/customer';
import { CustomContentRequest, simplifySearchSchema } from '@chat-widget/utils';
import { generateChatSystemPrompt, generateSearchDataSystemPrompt, generateCustomerIntentionSystemPrompt } from './prompts';

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
app.use('/api/*', sanitizeMessages);

/**
 * Handles sending user message and streaming of chat responses from OpenAI
 * 
 * Process:
 * 1. Validates request data
 * 2. Creates system message with instructions
 * 3. Streams chat responses from OpenAI
 * 4. Sends streamed responses to client
 */
app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
  const { messages, searchConfig, currentData } = req.body;

  if (!messages) {
    res.status(400).json({ error: 'messages required' });
    return;
  }

  try {
    // Create system message from chatConfig
    const systemMessage = {
      role: 'system',
      content: generateChatSystemPrompt(
        chatConfig.businessContext,
        chatConfig.userContext,
        chatConfig.instructions,
        searchConfig,
        currentData
      )
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
  const { messages, currentData, searchConfig } = req.body;

  if (!messages) {
    res.status(400).json({ error: 'messages and searchData are required' });
    return;
  }

  try {
    // Create system message for search data extraction
    const systemMessage = {
      role: 'system',
      content: generateSearchDataSystemPrompt(currentData, searchConfig)
    };

    // Add system message to the start of the messages array
    const messagesWithSystem = [systemMessage, ...messages];

    const simplifiedSchema = simplifySearchSchema(searchConfig);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          schema: {
            type: 'object',
            properties: simplifiedSchema,
            required: Object.keys(simplifiedSchema),
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

/**
 * Analyzes customer messages to extract and update intention data.
 * 
 * Process:
 * 1. Validates message history
 * 2. Merges with existing intention data
 * 3. Updates only when new information provides clearer insight
 * 4. Preserves all fields unless explicitly updated
 * 
 * Returns updated customer intention object with preferences, priorities, and objectives.
 */
app.post('/api/customer-intention', async (req: Request, res: Response) => {
  const { messages, currentData } = req.body;

  if (!messages) {
    res.status(400).json({ error: 'messages are required' });
    return;
  }

  // TODO: Improve the quality of this prompt. Make it more structured with process, rules, context, etc.
  // Put the json output structure in the prompt, explaining the fields and their definitions. Come up with clear conceptual delineations between each field. We want to avoid double double ups. Likes and dislikes are thematic. Priorities should have a higher bar.
  // Add rules about how to handle changing preferences, i.e. when someone contradicts themselves or changes their mind "i want somewhere hot, actually lets look somewhere cold"
  // Clarify the format, length, and descriptive nature of likes, dislikes, and priorities. Ensure these are descriptive enough to be used as embeddings, or fed into other model inputs.
  // Come up with a way of handling conflicting or contradictory preferences. Customer prospect?
  try {
    const systemMessage = {
      role: 'system',
      content: generateCustomerIntentionSystemPrompt(currentData)
    };

    const messagesWithSystem = [systemMessage, ...messages];

    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      response_format: zodResponseFormat(CustomerIntentionSchema, 'customer_intention')
    });

    res.json(completion.choices[0].message.parsed);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

/**
 * Moderates user messages for inappropriate content.
 * 
 * Uses OpenAI's moderation API to check for:
 * - Harmful content
 * - Inappropriate language
 * - Unsafe requests
 * 
 * Returns:
 * - flagged: boolean indicating if content violates policies
 * - categories: specific violation categories if flagged
 */
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

/**
 * Handles content generation requests with preference matching.
 * 
 * Process:
 * 1. Validates request data using Zod schema
 * 2. Checks for strong preference match if required
 * 3. Generates personalized content based on preferences
 * 4. Returns content with relevant metadata
 */
app.post('/api/generate-custom-content', async (req: Request<{}, {}, CustomContentRequest>, res: Response) => {
  const requestData = req.body;

  // TODO: Is there a better way to do this? Can we do in constructor?
  if (!requestData.itemInformation || 
      !requestData.customerIntention || 
      !requestData.name ||
      !requestData.instructions || 
      !requestData.minCharacters || 
      !requestData.maxCharacters) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  try {
    const contentGenerator = new ContentGeneratorService(openai);
    const result = requestData.strongMatchOnly 
      ? await contentGenerator.generateStrongMatchContent(requestData)
      : await contentGenerator.generateContent(requestData);
    res.json(result);
  } catch (error) {
    console.error('[API] Content generation error:', error);
    res.status(500).json({ error: 'An error occurred while generating custom content' });
  }
});

/**
 * Analyzes customer messages to extract prospect details.
 * 
 * Extracts specific information about:
 * - Product/service type preferences
 * - Price range considerations
 * - Required specifications
 * - Other explicit preferences
 * 
 * Only includes information that is explicitly stated or confirmed by the user.
 */
app.post('/api/customer-prospect', async (req: Request, res: Response) => {
  const { messages } = req.body;

  if (!messages) {
    res.status(400).json({ error: 'messages are required' });
    return;
  }

  try {
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant tasked with analyzing customer messages to extract details about what they're looking for.
        Extract specific details about the type, price range, specifications, and preferences.
        Only include information explicitly stated by the user or confirmed by them after suggestion.
        You must return the data in the exact format specified by the schema.`
    };

    const messagesWithSystem = [systemMessage, ...messages];

    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-mini',
      messages: messagesWithSystem,
      response_format: zodResponseFormat(CustomerProspectSchema, 'customer_prospect')
    });

    res.json(completion.choices[0].message.parsed);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing the request' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
