import { Personne } from "./personne";

export class Membre extends Personne {

    public id?:number // idantifiant membre
    public status?:string //etat actif non actif dans le projet
    public photo?:Uint8Array|Array<Uint8Array>


}
