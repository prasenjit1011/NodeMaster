// controllers/country.controller.ts

import { FastifyRequest, FastifyReply } from "fastify";
import { CountryService } from "./country.service";

const service = new CountryService();

// 🔹 Define types for params & body
type IdParams = {
  id: string;
};

type CountryBody = {
  countryname: string;
  status: boolean;
};

export class CountryController {

  static async getAll(
    _request: FastifyRequest,
    reply: FastifyReply
  ) {
    const data = await service.getAllCountries();
    return reply.send(data);
  }

  static async getById(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    const country = await service.getCountry(Number(request.params.id));

    if (!country) {
      return reply.code(404).send({ message: "Not found" });
    }

    return reply.send(country);
  }

  static async create(
    request: FastifyRequest<{ Body: CountryBody }>,
    reply: FastifyReply
  ) {
    const country = await service.createCountry(request.body);
    return reply.code(201).send({...country, id: Number(country.id)});
  }

  static async update(
    request: FastifyRequest<{ Params: IdParams; Body: Partial<CountryBody> }>,
    reply: FastifyReply
  ) {
    const success = await service.updateCountry(
      Number(request.params.id),
      request.body
    );

    if (!success) {
      return reply.code(404).send({ message: "Not found" });
    }

    return reply.send({ message: "Updated" });
  }

  static async delete(
    request: FastifyRequest<{ Params: IdParams }>,
    reply: FastifyReply
  ) {
    const success = await service.deleteCountry(
      Number(request.params.id)
    );

    if (!success) {
      return reply.code(404).send({ message: "Not found" });
    }

    return reply.send({ message: "Deleted" });
  }
}