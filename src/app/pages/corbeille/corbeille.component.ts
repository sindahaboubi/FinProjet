import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Membre } from 'src/app/model/membre';
import { TacheTicket } from 'src/app/model/tache-ticket';
import { CorbeilleService } from 'src/app/service/corbeille.service';
import { MembreService } from 'src/app/service/membre.service';
import { SprintBacklogService } from 'src/app/service/sprint-backlog.service';
import { SprintService } from 'src/app/service/sprint.service';
import { WebSocketTicketTacheService } from 'src/app/service/web-socket-ticket-tache.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-corbeille',
  templateUrl: './corbeille.component.html',
  styleUrls: ['./corbeille.component.scss']
})
export class CorbeilleComponent implements OnInit {

  tacheSupprime :TacheTicket[] = []
  chercher:FormControl = new FormControl("")
  membre:Membre
  tacheSprintMap:Map<number,TacheTicket[]> = new Map<number,TacheTicket[]>()
  tacheSprintMapFiltred:Map<number,TacheTicket[]> = new Map<number,TacheTicket[]>(this.tacheSprintMap)

  constructor(
    private corbeilleService: CorbeilleService,
    private sprintBacklogService:SprintBacklogService,
    private webSocketTache:WebSocketTicketTacheService,
    private membreService:MembreService
  ){

    this.webSocketTache.messageHandlingAdd(null).subscribe(
      message => {
        if(message.subscribe){
          this.webSocketTache.ticketTache = message.subscribe
        }
      },
      error => {
        console.log(error);
      }
    )
  }




  ngOnInit(): void {
    this.membre = this.membreService.getMembreFromToken();
    const productBacklog = JSON.parse(localStorage.getItem('productBacklogCourant'))
    this.corbeilleService.getTacheCorbeilleByMembreId(this.membre.id).subscribe(
      dataCorbeille => {
        dataCorbeille = dataCorbeille.filter(taches => taches.ht.productBacklogId == productBacklog.id)
        for(let tache of dataCorbeille){
          const sprintId = tache.ht.sprintId;
          if (!this.tacheSprintMap.has(sprintId)) {
            this.tacheSupprime = dataCorbeille.filter(ticket => ticket.ht.sprintId == sprintId)
            this.tacheSprintMap.set(sprintId,this.tacheSupprime)
            this.tacheSupprime = []
          }
        }
        console.log( this.tacheSprintMap );

      }
    )



    this.chercher.valueChanges.subscribe(
      mot =>{
        const map =  new Map(this.tacheSprintMap)
        const dernierLettre = mot[mot.length-1]?.toLowerCase()
          this.tacheSprintMap.forEach((value,key) => {
          this.tacheSprintMapFiltred.set(key,value.filter(tache =>
            (tache.titre.toLowerCase().indexOf(dernierLettre) == mot.indexOf(dernierLettre))
            &&
            tache.titre.toLowerCase().includes(mot)))
        })
        if(mot == "")
          this.tacheSprintMap = map
      }
    )

  }


  viderCorbeille(){
    Swal.fire({
      title: "vous êtes sûr de vider la corbeille ! ",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, vider!',
      cancelButtonText: 'Annuler',
      background:'rgba(0,0,0,0.9)',
      backdrop: 'rgba(0,0,0,0.4)',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      focusConfirm: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.corbeilleService.viderCorbeille().subscribe(
          data => {
            this.tacheSprintMap.forEach((value,key) => {
              this.tacheSprintMap
              .get(key)
              ?.splice(0,this.tacheSprintMap.get(key).length-1)

              this.tacheSprintMapFiltred
              .get(key)
              ?.splice(0,this.tacheSprintMapFiltred.get(key).length-1)
            })
            Swal.fire(
            'Terminé ',
            data,
            'success'
          )
        },
          error =>Swal.fire(
            'Terminé ',
            'on n\' a pas pus vider votre corbeille',
            'success'
          )
        )
      }
    })
  }

  getBackgroundColor(index: number): any {
    if (index % 2 === 0) {
      return { 'background-color': '#C8F8F3' };
    } else if (index % 3 == 0 && index % 2 == 0) {
      return { 'background-color': '#F0FCCA' };
    } else if (index % 3 == 0) {
      return { 'background-color': '#EFF8C2' };
    } else if (index % 7 == 0) {
      return { 'background-color': '#F8E7C2' };
    }else if (index == 1) {
      return { 'background-color': '#DDDAD3' };
    } else {
      return {};
    }
  }

  supprimerDefinitive(sprintId:number,id:number){
    const tache = this.tacheSprintMap.get(sprintId).find(ticket => ticket.id == id);
    Swal.fire({
      title: "vous êtes sûr de supprimer cette tâche definitivement : ",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprmer!',
      cancelButtonText: 'Annuler',
      background:'rgba(0,0,0,0.9)',
      backdrop: 'rgba(0,0,0,0.4)',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      focusConfirm: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.corbeilleService.deleteTacheFromCorbeille(id,"global").subscribe(
          data => {
            console.log(data)

            this.tacheSprintMap
            .get(sprintId)
            ?.splice(this.tacheSprintMap.get(sprintId).indexOf(tache),1)

            this.tacheSprintMapFiltred
            .get(sprintId)
            ?.splice(this.tacheSprintMapFiltred.get(sprintId).indexOf(tache),1)
          }

        )
      }
    })

  }

  recycler(sprintId:number,id:number){
    const tache = this.tacheSprintMap.get(sprintId).find(ticket => ticket.id == id);
    const sprint = this.tacheSprintMap.get(sprintId).find(ticket => ticket.ht.sprintId == sprintId ).ht.sprint
    if(tache.sprintBacklogId == null && tache.ht.sprint.etat == "en cours")
      this.sprintBacklogService.afficherSprintBacklogBySprintId(tache.ht.sprint.id).subscribe(
        sprintBacklog => {
          tache.sprintBacklog = sprintBacklog;
          tache.sprintBacklogId = sprintBacklog.id;
          /** meme si la tache existe déjà c'est une modification  */
          this.corbeilleService.regenererTacheSupprimer(tache).subscribe(
            tacheData =>{
              this.corbeilleService.deleteTacheFromCorbeille(id,"local").subscribe(
                data => {
                  console.log(data)
                  this.tacheSprintMap
                  .get(sprintId)
                  ?.splice(this.tacheSprintMap.get(sprintId).indexOf(tache),1)
                  this.webSocketTache.messageHandlingAdd(tache).subscribe()
                  this.tacheSprintMapFiltred
                  .get(sprintId)
                  ?.splice(this.tacheSprintMapFiltred.get(sprintId).indexOf(tache),1)
                },
                error =>{
                  console.log(error);
                  Swal.fire(
                    'insertion annulé',
                    'vous avez déjà cette ticket tâche.',
                    'error'
                  )
                }
              )
            }
          )
        }
      )
    else if(sprint.etat != "termine")
      this.corbeilleService.deleteTacheFromCorbeille(id,"local").subscribe(
        data => {
          console.log(data)
          this.tacheSprintMap
                  .get(sprintId)
                  ?.splice(this.tacheSprintMap.get(sprintId).indexOf(tache),1)
                  this.webSocketTache.messageHandlingAdd(tache).subscribe()
                  this.tacheSprintMapFiltred
                  .get(sprintId)
                  ?.splice(this.tacheSprintMapFiltred.get(sprintId).indexOf(tache),1)
        },
        error =>{
          console.log(error);
          Swal.fire(
            'insertion annulé',
            'vous avez déjà cette ticket tâche.',
            'error'
          )
        }
      )
    else
        Swal.fire(
          'Attention !',
          'le sprint de cette tâche est terminé',
          'error'
        )
  }

}
