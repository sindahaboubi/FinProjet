import { Component, OnInit } from '@angular/core';
import { Membre } from 'src/app/model/membre';
import { Role } from 'src/app/model/role';
import { TacheTicket } from 'src/app/model/tache-ticket';
import { RoleService } from 'src/app/service/role.service';
import { TicketTacheService } from 'src/app/service/ticket-tache.service';
import {Chart} from 'chart.js';
import { MatDialog } from '@angular/material/dialog';
import { PerformanceCourbeComponent } from '../dialogs/performance-courbe/performance-courbe.component';
import { AuthentificationService } from 'src/app/service/authentification.service';
import { MembreService } from 'src/app/service/membre.service';
import { ProjetServiceService } from 'src/app/service/projet-service.service';
import { ChefProjet } from 'src/app/model/chef-projet';


export interface PerformanceData{
  membreActuelle : Membre,
  tousLesTache:TacheTicket[],
  tacheTerminer:TacheTicket[],
  tacheEnCours:TacheTicket[],
  tacheAVerifier:TacheTicket[],
  tacheAFaire:TacheTicket[]
}

@Component({
  selector: 'app-list-membre-projet',
  templateUrl: './list-membre-projet.component.html',
  styleUrls: ['./list-membre-projet.component.scss']
})
export class ListMembreProjetComponent implements OnInit{

  listeMembreProjet:Membre[]=[]
  listeTacheMembre:TacheTicket[]
  /**filtre des tache */
  ticketTacheMembre:TacheTicket[]
  listeTacheAVerifier:TacheTicket[]=[]
  listeTacheEnCours:TacheTicket[]=[]
  listeRole:Role[]
  listeTacheTermine:TacheTicket[]=[]
  listeTacheAFaire:TacheTicket[]=[]

  /** end */

  /** map de filtrage */

  tacheAVerifierMembre:Map<Membre,TacheTicket[]> = new Map<Membre,TacheTicket[]>();
  tacheEncoursMembre:Map<Membre,TacheTicket[]> = new Map<Membre,TacheTicket[]>();
  tacheTerminerMembre:Map<Membre,TacheTicket[]> = new Map<Membre,TacheTicket[]>();
  tacheAFaireMembre:Map<Membre,TacheTicket[]> = new Map<Membre,TacheTicket[]>();


  /** end */

  constructor(
    private roleService:RoleService,
    private ticketTacheService:TicketTacheService,
    private performanceDialog:MatDialog,
    private authentificationService:AuthentificationService,
    private membreService:MembreService,
    private projetService:ProjetServiceService
  ){}

  role:string;
  chefProjet:ChefProjet;
  membre:Membre;

  decodeImage(values: string): string {
    const byteValues = values.split(',').map(Number);
    const byteArray = new Uint8Array(byteValues);

    const base64String = btoa(String.fromCharCode.apply(null, byteArray));
    const imageSource = 'data:image/png;base64,' + base64String;

    return imageSource;
  }

  decodedImage: string;

  ngOnInit(): void {
    const { chefProjet, membre, roles } = this.authentificationService.getUserRolesToken(sessionStorage.getItem('token'));
    if (roles.includes('chefProjet')) {
      this.chefProjet = chefProjet;
    } else {
      this.membre = membre;
      console.log("Le membre = ", this.membre);

      this.decodedImage = this.decodeImage(this.membre.photo.toString());
      console.log(this.decodeImage)

    }
        if(this.authentificationService.getUserRolesToken(sessionStorage.getItem('token')).roles.includes('chefProjet')){
      this.role='chefProjet';
    }else{
      const roleToken = this.authentificationService.getUserRolesToken(sessionStorage.getItem('token')).roles as Role[]
      this.role = roleToken.find(role =>
         role.pk.membreId == this.membreService.getMembreFromToken().id
         && role.pk.projetId == this.projetService.getProjetFromLocalStorage().id).type
         console.log("wellllllltedd+",this.role);
    }

    const projet = JSON.parse(localStorage.getItem('projet'))
    this.roleService.afficherListRoleParProjet(projet.id).subscribe(
      dataRoles => {
        this.listeRole = dataRoles.filter(role => role.status == "ACCEPTE")
        for(let role of dataRoles){
          if(role.status == "ACCEPTE" && role.type=="dev team")
            this.listeMembreProjet.push(role.membre)
        }
        console.log(this.listeMembreProjet);
        /** recuperer la liste des tâche */

        for(let membre of this.listeMembreProjet){
          this.ticketTacheService.getTicketsTacheByMembreId(membre.id).subscribe(
            ticketsTacheData=>{
               ticketsTacheData = ticketsTacheData.filter(tache=>
                tache.ht.productBacklogId == JSON.parse(localStorage.getItem('productBacklogCourant')).id
                )
                this.listeTacheAVerifier = ticketsTacheData.filter(tache=> tache.etat == "à verfier")
                this.listeTacheTermine = ticketsTacheData.filter(tache=> tache.etat == "terminé")
                this.listeTacheAFaire = ticketsTacheData.filter(tache=> tache.etat == "à faire")
                this.listeTacheEnCours = ticketsTacheData.filter(tache=> tache.etat == "en cours")
               /** remplissage des maps */
               this.tacheAFaireMembre.set(membre,this.listeTacheAFaire)
               this.tacheAVerifierMembre.set(membre,this.listeTacheAVerifier)
               this.tacheEncoursMembre.set(membre,this.listeTacheEnCours)
               this.tacheTerminerMembre.set(membre,this.listeTacheTermine)
               /** end */
            }
          )
        }
        /** end de recuperation  */
        console.log(this.tacheAFaireMembre);
        console.log("==============================");
        console.log(this.tacheAVerifierMembre);
        console.log("==============================");
        console.log(this.tacheEncoursMembre);
        console.log("==============================");
        console.log(this.tacheTerminerMembre);
      }
    )
  }

  chart:Chart

  openPerformanceDialog(membre:Membre){
    const tacheTerminer = this.tacheTerminerMembre.get(membre)
    const tacheEnCours = this.tacheEncoursMembre.get(membre)
    const tacheAVerifier = this.tacheAVerifierMembre.get(membre)
    const tacheAFaire = this.tacheAFaireMembre.get(membre)
    this.ticketTacheMembre = [
      ...tacheEnCours,
      ...tacheTerminer,
      ...tacheAVerifier,
      ...tacheAFaire
    ]
    const dialogRef = this.performanceDialog.open(PerformanceCourbeComponent,{
      width:'700px',
      height:'570px',
      data :{
        membreActuelle:membre,
        tousLesTache:this.ticketTacheMembre,
        tacheTerminer:tacheTerminer,
        tacheEnCours:tacheEnCours,
        tacheAVerifier:tacheAVerifier,
        tacheAFaire:tacheAFaire
      }
    })
  }


}




