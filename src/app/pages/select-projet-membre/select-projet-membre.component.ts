import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Projet } from 'src/app/model/projet';
import { Role } from 'src/app/model/role';
import { RoleService } from 'src/app/service/role.service';
import Swal from 'sweetalert2';
import { ProjetKeyComponent } from '../dialogs/projet-key/projet-key.component';
import { MatDialog } from '@angular/material/dialog';
import { MembreService } from 'src/app/service/membre.service';

@Component({
  selector: 'app-select-projet-membre',
  templateUrl: './select-projet-membre.component.html',
  styleUrls: ['./select-projet-membre.component.scss']
})
export class SelectProjetMembreComponent implements OnInit {
  projets:Projet[]=[];
  roles:Role[]
  constructor(
    private toastr: ToastrService,
    private keyMatDialogue:MatDialog,
    private roleService:RoleService,
    private membreService:MembreService
  ){}
  ngOnInit(): void {
    // const membre = JSON.parse(localStorage.getItem('membre'))
    this.roleService.afficherListRoleParMembre(this.membreService.getMembreFromToken().id).subscribe(
      data =>{
        this.roles = data.filter(role => this.verifDate(role.invitation.dateExpiration) )
        console.log(data);

        for(let role of data)
          if( role.status == "ACCEPTE")
            this.projets.push(role.projet)

        this.roles = this.roles.filter(role => role.status == "ATTENTE")
      },
      error => {
        console.log(error.status);

        if (error.status == 401)
          Swal.fire(
            'Attention',
            'Vous n\'avez pas une autorisation',
            'error'
          )
      }
    )
  }

  gerer(index:number){
    const dialogRef = this.keyMatDialogue.open(ProjetKeyComponent,{
      width: '50%',
      height:'25%',
      data: {
        projet:this.projets[index]
      }
    });
  }



  verifDate(dateRec:Date){
    const aujourdhui = new Date()
    dateRec= new Date(dateRec)
    console.log(dateRec > aujourdhui);

    return  dateRec > aujourdhui
  }

  accepter(role:Role){
    role.status = "ACCEPTE"
    this.roleService.modifierRole(role).subscribe(
      data =>{
        console.log(data);
        this.roles.splice(this.roles.indexOf(role),1)
        this.toastr.success("vous avez accepté l'invitation")
        console.log(this.roles.find(role =>( role.pk.membreId == data.pk.membreId )&& (role.pk.projetId == data.pk.projetId)));
        this.projets.push(this.roles.find(role =>( role.pk.membreId == data.pk.membreId )&& (role.pk.projetId == data.pk.projetId)).projet);
      }
    )
  }

  refuser(role:Role){
    Swal.fire({
      title: "Vous êtes sûr de refuser l'invitation",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler',
      background:'rgba(0,0,0,0.9)',
      backdrop: 'rgba(0,0,0,0.4)',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      focusConfirm: false
    }).then((result) => {
      if (result.isConfirmed) {
          this.roleService.supprimerRole(role.pk,role.invitation.chefProjetId).subscribe(
            data =>{
              Swal.fire(
                'Refus',
                'Vous avez rejeté l offre',
                'warning'
              )
              this.roles.splice(this.roles.indexOf(role),1)
            }
          )
      }
    });


  }


}
