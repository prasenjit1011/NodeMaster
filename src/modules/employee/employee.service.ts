import { EmployeeRepository } from './employee.repository';

export class EmployeeService {
  private repo = new EmployeeRepository();

  create(data: any) {
    return this.repo.create(data);
  }

  getAll(page: number, limit: number) {
    return this.repo.findAll(page, limit);
  }

  getById(id: number) {
    return this.repo.findById(id);
  }

  update(id: number, data: any) {
    return this.repo.update(id, data);
  }

  delete(id: number) {
    return this.repo.delete(id);
  }
}