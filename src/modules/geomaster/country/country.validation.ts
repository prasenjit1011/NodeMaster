import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../../../config/db";

// Types
type IdParams = {
  id: string;
};

type CreateCountryBody = {
  countryname: string;
  status: boolean;
};

type UpdateCountryBody = {
  countryname?: string;
  status?: boolean;
};

// ✅ Validate ID param
export const validateId = async (
  request: FastifyRequest<{ Params: IdParams }>,
  reply: FastifyReply
) => {
  const id = Number(request.params.id);

  if (isNaN(id) || id <= 0) {
    return reply.status(400).send({
      error: "Invalid ID",
    });
  }
};

// ✅ Create validation
export const validateCreateCountry = async (
  request: FastifyRequest<{ Body: CreateCountryBody }>,
  reply: FastifyReply
) => {
  const { countryname, status } = request.body;

  if (!countryname || typeof countryname !== "string" || countryname.trim() === "") {
    return reply.status(400).send({
      error: "Country name is required and must be a non-empty string",
    });
  }

  if (status === undefined || typeof status !== "boolean") {
    return reply.status(400).send({
      error: "Status is required and must be a boolean",
    });
  }

  // Check for uniqueness
  const existingCountry = await prisma.country.findUnique({
    where: { countryname: countryname.trim() },
  });

  if (existingCountry) {
    return reply.status(409).send({
      error: "Country name already exists",
    });
  }
};

// ✅ Update validation
export const validateUpdateCountry = async (
  request: FastifyRequest<{ Params: IdParams; Body: UpdateCountryBody }>,
  reply: FastifyReply
) => {
  const { countryname, status } = request.body;
  const id = Number(request.params.id);

  if (countryname === undefined && status === undefined) {
    return reply.status(400).send({
      error: "At least one field (countryname or status) is required",
    });
  }

  if (countryname !== undefined) {
    if (typeof countryname !== "string" || countryname.trim() === "") {
      return reply.status(400).send({
        error: "Country name must be a non-empty string",
      });
    }

    // Check for uniqueness (excluding current country)
    const existingCountry = await prisma.country.findFirst({
      where: {
        countryname: countryname.trim(),
        id: { not: id },
      },
    });

    if (existingCountry) {
      return reply.status(409).send({
        error: "Country name already exists",
      });
    }
  }

  if (status !== undefined) {
    if (typeof status !== "boolean") {
      return reply.status(400).send({
        error: "Status must be a boolean",
      });
    }
  }
};