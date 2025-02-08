import { z } from 'zod';

export const CustomerIntentionSchema = z.object({
  objective: z.enum(["discover", "transact", "compare", "resolve", "customize"])
    .describe("The primary goal the customer aims to achieve. If not clear, leave undefined."),
  budget: z.number()
    .describe("The amount the customer wants to spend. If not explicity mentioned, leave undefined."),
  urgency_level: z.enum(['1', '2', '3'] as const)
    .describe("How urgently the customer needs to achieve their objective. (1: low, 2: medium, 3: high). If not clear, leave undefined."),
  pain_points: z.array(z.string())
    .describe("The challenges or problems the customer is trying to solve. Unless explicitly stated, leave undefined."),
  likes: z.array(z.string())
    .describe("The customer's likes. If not clear, leave undefined."),
  dislikes: z.array(z.string())
    .describe("The customer's dislikes. If not clear, leave undefined."),
  priorities: z.array(z.string())
    .describe("The customer's preferences. Single word description e.g. price, location, style. If not clear, leave undefined.")
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