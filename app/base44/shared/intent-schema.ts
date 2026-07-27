import { z } from "npm:zod@4.4.3";

export const orderIntentSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            spoken_name: z.string().min(1).max(160),
            quantity: z.number().int().min(1).max(20),
            modifiers: z.array(z.string().max(120)).max(12),
          })
          .strict(),
      )
      .min(1)
      .max(20),
    merchant_preference: z.string().max(160).optional(),
    category: z.enum(["food", "grocery"]),
    delivery_or_pickup: z.enum(["delivery", "pickup"]),
    notes: z.string().max(500).optional(),
    ambiguities: z.array(z.string().max(240)).max(5),
    language: z.literal("pt-BR"),
  })
  .strict();
