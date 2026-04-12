import { CountryRepository } from "./country.repository";

// Types
export interface Country {
  id?: number;
  countryname: string;
  status: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class CountryService {
  private repo: CountryRepository;

  constructor() {
    this.repo = new CountryRepository();
  }

  async getAllCountries(): Promise<Country[]> {
    return await this.repo.findAll();
  }

  async getCountry(id: number): Promise<Country | null> {
    return await this.repo.findById(id);
  }

  async createCountry(country: Omit<Country, "id" | "created_at" | "updated_at">): Promise<Country> {
    return await this.repo.create(country);
  }

  async updateCountry(id: number, country: Partial<Omit<Country, "id" | "created_at" | "updated_at">>): Promise<boolean> {
    const updatedCountry = await this.repo.update(id, country);
    return !!updatedCountry;
  }

  async deleteCountry(id: number): Promise<boolean> {
    return await this.repo.delete(id);
  }
}