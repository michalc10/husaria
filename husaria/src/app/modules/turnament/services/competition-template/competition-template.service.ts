import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ICompetitionTemplate } from 'src/app/models/competitionTemplate';
import { CrudService } from 'src/app/shered/service/crud.service';

@Injectable({ providedIn: 'root' })
export class CompetitionTemplateService {
  private route = 'competition-template';

  constructor(private crud: CrudService) {}

  list(): Observable<ICompetitionTemplate[]> {
    return this.crud.list<ICompetitionTemplate>(this.route);
  }

  create(data: Partial<ICompetitionTemplate>): Observable<ICompetitionTemplate> {
    return this.crud.create<Partial<ICompetitionTemplate>, ICompetitionTemplate>(this.route, data);
  }

  update(id: string, data: Partial<ICompetitionTemplate>): Observable<ICompetitionTemplate> {
    return this.crud.update<Partial<ICompetitionTemplate>, ICompetitionTemplate>(this.route, id, data);
  }

  delete(id: string): Observable<void> {
    return this.crud.delete(this.route, id);
  }
}
