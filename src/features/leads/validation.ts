import { z } from "zod";

export const customerContactSchema = z.object({
  name: z.string().trim().min(2, "Enter the customer name."),
  mobile: z
    .string()
    .trim()
    .min(8, "Enter a valid mobile number.")
    .max(20, "Mobile number is too long."),
  email: z
    .string()
    .trim()
    .email("Enter a valid email.")
    .optional()
    .or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const productEnquirySchema = customerContactSchema.extend({
  productSlug: z.string().trim().min(1),
  productName: z.string().trim().min(1),
  sku: z.string().trim().min(1),
  sellingPrice: z.coerce.number().nonnegative(),
});

export const quoteRequestSchema = customerContactSchema.extend({
  productSlugs: z.array(z.string().trim().min(1)).min(1),
});
