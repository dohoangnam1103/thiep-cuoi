import { z } from "zod";

export const editorialTemplateDataSchema = z.object({
  coverLabel: z.string().trim().min(1).default("Save the date"),
  featureLabel: z.string().trim().min(1).default("Chuyện chúng mình"),
  closingLabel: z.string().trim().min(1).default("Lời cảm ơn"),
  titleStyle: z.enum(["compact", "wide"]).default("compact"),
});

export type EditorialTemplateData = z.infer<typeof editorialTemplateDataSchema>;
