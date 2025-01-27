import express, { Request, Response } from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Configure CORS options
const corsOptions = {
  origin: 'http://localhost:3000', // Replace with your frontend's URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
};

// Create new OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Set your OpenAI API key in the .env file
});

// Use CORS middleware
app.use(cors(corsOptions));
app.use(express.json());

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));


// Handle sending user message and streaming of chat responses from OpenAI
app.post('/api/chat', async (req: Request, res: Response) => {
  const { messages } = req.body; // Accept the complete messages array

  if (!messages) {
    res.status(400).json({ error: 'messages required' });
    return;
  }

  try {
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages, // Use the messages array from the request body
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(content); // Stream each chunk to the openai
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
  const { content, searchData } = req.body;

  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  if (!searchData || Object.keys(searchData).length === 0) {
    res.status(400).json({ error: 'Structured data is required' });
    return;
  }

  const prompt = `You are a helpful assistant. I am going to provide you a message from a user, and you will analyze it to identify key data points to help with their experience.
  The user message text is here: 
  ${content}.`;

  console.log('searchData', searchData);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_data',
          schema: {
            type: 'object',
            properties: searchData,
            required: Object.keys(searchData),
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
  const { content, customerIntention } = req.body;

  if (!content) {
    res.status(400).json({ error: 'content is required' });
    return;
  }

  if (!customerIntention || Object.keys(customerIntention).length === 0) {
    res.status(400).json({ error: 'Customer intention is required' });
    return;
  }

  const prompt = `You are a helpful assistant. I am going to provide you a message from a user, and you will analyze it to identify key data points about their intentions.
  The user message text is here: 
  ${content}.`;

  console.log('customerIntention', customerIntention);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: prompt }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'extracted_intentions',
          schema: {
            type: 'object',
            properties: customerIntention,
            required: Object.keys(customerIntention),
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

app.post('/api/moderate', async (req: Request, res: Response) => {
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
