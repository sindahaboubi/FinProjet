import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TicketHistoire } from '../model/ticket-histoire';
import { map } from 'rxjs';
import { Membre } from '../model/membre';
import jwt_decode from 'jwt-decode';
import { Role } from '../model/role';

const URL = "http://localhost:9999/membre-service/membres"
const URL2 = "http://localhost:9999/inscription-service/auth"


@Injectable({
  providedIn: 'root'
})
export class MembreService {

  constructor(private http: HttpClient) { }

  getHistoireTicketsByMembreId(membreId: number): Observable<TicketHistoire[]> {
    return this.http.get<TicketHistoire[]>(`${URL}/${membreId}/histoiresTickets`);
  }


  afficherTousMembres(){
    return this.http.get<Membre[]>(`${URL}`,{ observe: 'response' })
    .pipe(
      map(response => {
        const membres: Membre[] = response.body;
        if(response.status ===404)
          return []
        return membres;
      }))
  }

  getMembreById(idMembre:number){
    return this.http.get<Membre>(`${URL}/`+idMembre,{ observe: 'response' })
    .pipe(
      map(response => {
        const m: Membre = response.body;
        if(response.status ===404)
          return null;
        return m;
      }));
  }

  supprimerMembre(id:number):Observable<void>{
    return this.http.delete<void>(`${URL}/`+id);
  }

  inscription(membre:Membre){
    return this.http.post<Membre>(`${URL2}/membre`,membre,{observe:'response'})
    .pipe(
      map(
        response =>{
          const membreInscris: Membre = response.body;
          if(response.status == 400)
            return null
          return membreInscris;
        }
      )
    )
  }

  // modifierProfil(membre: Membre): Observable<Membre> {
  //   return this.http.put<Membre>(`${URL}`, membre);
  // }

  decodeToken(token: string): any {
    const decodedToken = jwt_decode(token);
    return decodedToken;
  }

  // getMembreFromToken(){
  //   const token = localStorage.getItem('token');
  //   const decodedToken = this.decodeToken(token);
  //   const { id, email, nom, prenom, adresse, username, telephone, status, dateInscription } = decodedToken;

  //   const membre: Membre = {
  //     id,
  //     email,
  //     nom: nom,
  //     prenom:prenom,
  //     adresse:adresse,
  //     username:username,
  //     telephone:telephone,
  //     status:status,
  //     dateInscription:dateInscription
  //   };
  //   return decodedToken;
  // }

  extractRolesFromToken(decodedToken: any): string[] |Role[] {
    const roles = decodedToken.roles || [];
    return roles;
  }

  getMembreFromToken() {
    const token = sessionStorage.getItem('token');
    const decodedToken = this.decodeToken(token);
    const roles = this.extractRolesFromToken(decodedToken);
    if(!roles.includes('chefProjet')){
      const { id, email, nom, prenom, adresse, username, telephone, status, dateInscription, photo } = decodedToken;

      let photoData: Uint8Array | Array<Uint8Array>;

      if (photo) {
        if (Array.isArray(photo)) {
          photoData = photo.map(p => new Uint8Array(atob(p).split('').map(c => c.charCodeAt(0))));
        } else {
          photoData = new Uint8Array(atob(photo).split('').map(c => c.charCodeAt(0)));
        }
      } else {
        photoData = [];
      }

      const membre: Membre = {
        id,
        email,
        nom: nom,
        prenom: prenom,
        adresse: adresse,
        username: username,
        telephone: telephone,
        status: status,
        dateInscription: dateInscription,
        photo: photoData
      };
      return membre;
    }
  }

  modifierMembre(membre:Membre): Observable<Membre>{
    return this.http.put<Membre>(`${URL}`,membre ,{ observe: 'response' })
    .pipe(
      map(response => {
        const modifiedMembre: Membre = response.body;
        if(response.status === 404) {
          return null;
        }
        return modifiedMembre;
      })
    );
  }
}
