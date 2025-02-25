import { z } from 'zod';

export const CustomerIntentionSchema = z.object({
  objective: z.enum(["discover", "transact", "compare", "resolve", "explore"])
    .describe(`Calculation: Track first stated goal + update as the user goal shifts. If you do not have enough information to make a determination, leave this NULL.
    Example: "I need to buy shoes quickly" → "transact"
    "Just looking at options" → "explore"
    "I want to compare different models" → "compare"
    "I need to find something specific" → "discover"
    "I have an issue I need help with" → "resolve"`).nullish(),

  budget: z.number().nullish()
    .describe(`Look for exact figures: "My budget is $500" 
    Capture currency conversions in real-time. If you do not have enough information to make a determination, leave this NULL.`),

  motivation_type: z.enum(["hedonic", "utilitarian", "normative", "mixed"]).nullish()
    .describe(`Infer this based on the customer's intent and the conversation history, looking for the most common theme. Only use mixed as a last resort:
    Hedonic: "fun", "enjoyment", "experience"
    Utilitarian: "need", "solve", "practical"
    Normative: "ethical", "popular", "recommended"
    Mixed: Multiple triggers present. Only set this as a last resort.
    If you do not have enough information to make a determination, leave this NULL.`),

  decision_style: z.enum(["rational", "impulsive", "risk_averse", "socially_influenced"]).nullish()
    .describe(`Determine through interaction patterns:
    Rational: Asks comparison questions, "pros/cons"
    Impulsive: Quick decisions <2min, "I'll take it"
    Risk Averse: Asks about returns/warranties
    Social: "What's popular?", "What others buy"
    If you do not have enough information to make a determination, leave this NULL.`),

  communication_style: z.object({
    tone: z.enum(["direct", "exploratory", "cautious", "enthusiastic"]).nullish()
      .describe(`Analyze sentence structure:
      Direct: Short sentences, imperative verbs
      Exploratory: "Maybe", "Perhaps", "What if"
      Cautious: "Not sure", "Let me think"
      Enthusiastic: Emojis, exclamation marks`),
    responsiveness: z.enum(["quick", "deliberate", "distracted"]).nullish()
      .describe(`Measure time between responses:
      Quick: <30s average response time
      Deliberate: >2min with long messages
      Distracted: Irregular timing, off-topic`),
    preferred_complexity: z.enum(["simple", "detailed", "technical"]).nullish()
      .describe(`Track vocabulary level:
      Simple: Basic terms, short sentences
      Detailed: "Can you compare features X and Y?"
      Technical: Jargon use, spec requests`)
  }).nullish(),

  trust_level: z.enum(["skeptical", "neutral", "confident"]).nullish()
    .describe(`Track acceptance of suggestions, how much the customer questions the suggestions, or how much they contradict or dislike the recommendations.
    Skeptical: "Why should I trust this?"
    Neutral: Asks for sources
    Confident: "Sounds good, proceed"
    If you do not have enough information to make a determination, leave this NULL.`),

  urgency_level: z.enum(['immediate', 'day', 'week', 'flexible']).nullish()
  .describe(`Parse time references:
  Immediate: "ASAP", "today"
  24h: "tomorrow", "next day"
  Week: "by Friday", "within 7 days"
  Flexible: No time mentions.
  If you do not have enough information to make a determination, leave this NULL.`),

  cognitive_load: z.enum(["low", "medium", "high"]).nullish()
    .describe(`Inger through repetition, clarification requests, or frustration markers.
    Repetition: Asking same question
    Clarification requests: "Can you repeat?"
    Frustration markers: "This is confusing"
    If you do not have enough information to make a determination, leave this NULL.`),

  sentiment: z.object({
    current: z.enum(["positive", "neutral", "negative"]).nullish()
      .describe(`Real-time NLP analysis:
      Positive: 😊, "great!", "excellent"
      Neutral: Factual statements
      Negative: 😠, "frustrated", "disappointed"`),
    trend: z.enum(["improving", "stable", "declining"]).nullish()
      .describe(`Compare last 3 messages:
      Improving: Negative → neutral → positive
      Declining: Positive → neutral → negative
      Stable: Same sentiment throughout`)
  }).nullish(),
  
  pain_points: z.array(z.string()).nullish()
    .describe(`Extract using problem keywords:
    "Frustrated with...", "Hate when...", 
    "Problem with...", "Challenge is..."`),
  
  priorities: z.array(z.string()).nullish()
    .describe(`Track explicit or repeated mentions:
    "Price is important" → price
    "Needs to be durable" → quality
    "Must be fast" → convenience, etc.`),

  value_hierarchy: z.array(z.enum(["price", "quality", "convenience", "social_status", "sustainability", "novelty"])).nullish()
    .describe(`Count priority mentions:
    "Price matters most" → price first
    "I want eco-friendly" → sustainability
    "Latest model" → novelty`),
  
  likes: z.array(z.string()).nullish()
    .describe(`Extract positive sentiment phrases:
    "I love...", "Really like..." "I'm looking for..." "Great experience with..." "Big fan of..." etc.
    If you do not have enough information to make a determination, leave this NULL.`),

  dislikes: z.array(z.string()).nullish()
    .describe(`Extract negative sentiment phrases:
    "I hate...", "Don't like..." "Bad experience with..." "Avoid...", "Stay away from..." "not a fan of..." etc.
    If you do not have enough information to make a determination, leave this NULL.`),
});

export const CustomerProspectSchema = z.object({
  type: z.string().describe("The type/category of prospect the customer is looking for"),
  priceRange: z.object({
    min: z.number(),
    max: z.number()
  }).describe("The price range the customer is willing to consider"),
  specifications: z.array(z.string()).describe("Key specifications or features the customer has mentioned"),
  preferences: z.array(z.string()).describe("Specific preferences or requirements mentioned by the customer")
}); 