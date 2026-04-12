export interface Country {
  id?: number;
  countryname: string;
  status: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// For create (no id, created_at, updated_at required)
export type CreateCountryDTO = Omit<Country, "id" | "created_at" | "updated_at">;

// For update (partial fields allowed, excluding timestamps)
export type UpdateCountryDTO = Partial<CreateCountryDTO>;