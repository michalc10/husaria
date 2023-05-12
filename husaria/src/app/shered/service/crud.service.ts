import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { api } from 'src/app/global';

@Injectable({
  providedIn: 'root'
})
export class CrudService {

  constructor(private http: HttpClient) { }

  // LIST
  list(rout: String): Observable<any[]> {
    return this.http.get<any[]>(api + rout);
  }

  // READ
  read(rout: String, id: String): Observable<any> {
    return this.http.get<any>(api + rout + '/' + id);
  }

  // CREATE
  create(rout: String, data: any): Observable<any> {
    return this.http.post<any>(api + rout, data);
  }

  // UPDATE
  update(rout: String, id: String, data: any): Observable<any> {
    return this.http.put<any>(api + rout + '/' + id, data);
  }

  // DELETE
  delete(rout: String, id: String): Observable<any> {
    return this.http.delete<any>(api + rout + '/' + id);
  }


}
