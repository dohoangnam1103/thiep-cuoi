import { z } from "zod";

export const cinematicTemplateDataSchema = z.object({
  openingLabel: z.string().trim().min(1).default("Save the date"),
  storyLabel: z.string().trim().min(1).default("Chuyện chúng mình"),
  closingLabel: z.string().trim().min(1).default("Ngày chung đôi"),
  endingLabel: z.string().trim().min(1).default("The beginning"),
});

export type CinematicTemplateData = z.infer<typeof cinematicTemplateDataSchema>;
