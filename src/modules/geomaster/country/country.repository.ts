import { prisma } from '../../../config/db';
import { Country, CreateCountryDTO, UpdateCountryDTO } from "./country.model";

export class CountryRepository {

  async findAll(): Promise<Country[]> {
    const countries = await prisma.country.findMany({
      orderBy: { id: "desc" },
    });

    return countries.map(country => ({
      id: country.id,
      countryname: country.countryname,
      status: country.status,
      created_at: country.created_at,
      updated_at: country.updated_at,
    }));
  }

  async findById(id: number): Promise<Country | null> {
    const country = await prisma.country.findUnique({
      where: { id },
    });

    if (!country) return null;

    return {
      id: country.id,
      countryname: country.countryname,
      status: country.status,
      created_at: country.created_at,
      updated_at: country.updated_at,
    };
  }

  async create(data: CreateCountryDTO): Promise<Country> {
    const createdCountry = await prisma.country.create({
      data,
    });

    return {
      id: createdCountry.id,
      countryname: createdCountry.countryname,
      status: createdCountry.status,
      created_at: createdCountry.created_at,
      updated_at: createdCountry.updated_at,
    };
  }

  async update(id: number, data: UpdateCountryDTO): Promise<Country | null> {
    try {
      const updatedCountry = await prisma.country.update({
        where: { id },
        data: {
          ...(data.countryname !== undefined && { countryname: data.countryname }),
          ...(data.status !== undefined && { status: data.status }),
        },
      });

      return {
        id: updatedCountry.id,
        countryname: updatedCountry.countryname,
        status: updatedCountry.status,
        created_at: updatedCountry.created_at,
        updated_at: updatedCountry.updated_at,
      };
    } catch (error) {
      // If record not found
      return null;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.country.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}