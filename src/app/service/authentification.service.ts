import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import jwt_decode from 'jwt-decode';
import { Role } from '../model/role';
import { ChefProjet } from '../model/chef-projet';
import { Membre } from '../model/membre';

const URL1 = "http://localhost:9999/authentification-service/auth";

@Injectable({
  providedIn: 'root'
})
export class AuthentificationService {

  constructor(private http:HttpClient) { }

  isLoggedIn(): boolean {
    const token = sessionStorage.getItem('token');
    return !!token;
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${URL1}/login`, credentials);
  }

  extractRolesFromToken(decodedToken: any): string[] |Role[] {
    const roles = decodedToken.roles || [];
    return roles;
  }

  decodeToken(token: string): any {
    const decodedToken = jwt_decode(token);
    return decodedToken;
  }

  getUserRolesToken(token: string) {
    const decodedToken = this.decodeToken(token);
    const roles = this.extractRolesFromToken(decodedToken);
    if(roles.includes('chefProjet')){
      const { id, email, nom, prenom, adresse, username, telephone, dateInscription, photo, pwd } = decodedToken;

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
      const chefProjet: ChefProjet = {
        id:id,
        email:email,
        nom: nom,
        prenom:prenom,
        adresse:adresse,
        username:username,
        telephone:telephone,
        dateInscription:new Date(dateInscription),
        photo: photoData,
        pwd: pwd

      };
      return {chefProjet, roles};
    }else{
      const { id, email, nom, prenom, adresse, username, telephone, dateInscription, pwd, status, photo } = decodedToken;

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
        dateInscription: new Date(dateInscription),
        pwd:pwd,
        photo: photoData
      };
      return {membre, roles};
    }
  }

}
