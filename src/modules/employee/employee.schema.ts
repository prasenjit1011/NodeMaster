import { z } from "zod";

/* ========================
   Base Fields (Reusable)
======================== */
const employeeBaseSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  email: z.string().email("Invalid email").toLowerCase(),
  salary: z.number().positive("Salary must be greater than 0"),
  imageUrl: z.string().url("Invalid URL").optional().nullable(),
});

/* ========================
   CREATE
======================== */
export const createEmployeeSchema = employeeBaseSchema;

/* ========================
   UPDATE (Partial)
======================== */
export const updateEmployeeSchema = employeeBaseSchema.partial();

/* ========================
   PARAMS: ID
======================== */
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a number")
    .transform((val) => Number(val)),
});

/* ========================
   QUERY: PAGINATION
======================== */
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((v) => Number(v)),

  limit: z
    .string()
    .optional()
    .default("5")
    .transform((v) => Number(v)),
});

export const employeeIdSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, "ID must be a number")
    .transform((val) => Number(val)),
});