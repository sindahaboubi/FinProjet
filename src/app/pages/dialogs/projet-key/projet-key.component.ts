import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClesProjet } from '../../select-projet/select-projet.component';
import { ProductBacklogService } from 'src/app/service/product-backlog.service';
import { FormControl, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { Membre } from 'src/app/model/membre';
import { RoleService } from 'src/app/service/role.service';
import { RolePk } from 'src/app/model/keys/role-pk';
import { MembreService } from 'src/app/service/membre.service';
import { ChefProjet } from 'src/app/model/chef-projet';
import { ChefProjetServiceService } from 'src/app/service/chef-projet-service.service';

@Component({
  selector: 'app-projet-key',
  templateUrl: './projet-key.component.html',
  styleUrls: ['./projet-key.component.scss']
})
export class ProjetKeyComponent implements OnInit {

  cles :FormControl = new FormControl("",[Validators.required]);
  membre:Membre;
  chefProjet:ChefProjet;

  constructor(
    private router:Router,
    public dialogRef: MatDialogRef<ProjetKeyComponent>,
    @Inject(MAT_DIALOG_DATA) public data:ClesProjet,
    private productBacklogService:ProductBacklogService,
    private roleService:RoleService,
    private membreService:MembreService
  ){}

  ngOnInit(): void {
    this.membre = this.membreService.getMembreFromToken();
  }

  confirmer(){
    if(this.data.projet.cles == this.cles.value.toUpperCase()) {
      Swal.fire({
        title: "Clé correct, vous êtes sûr de gérer le projet : "+this.data.projet.nom,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Oui, Lancer!',
        cancelButtonText: 'Annuler',
        background:'rgba(0,0,0,0.9)',
        backdrop: 'rgba(0,0,0,0.4)',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        focusConfirm: false
      }).then((result) => {
        if (result.isConfirmed) {
          localStorage.setItem('projet', JSON.stringify(this.data.projet));
          if(this.membre){
            const pk:RolePk = {
              membreId : this.membre.id,
              projetId : this.data.projet.id
            }
            this.roleService.afficherRole(pk).subscribe(
              data =>{
                localStorage.setItem("role", data.type);
              }
            )
          }
          this.productBacklogService.getProductBacklogByIdProjet(this.data.projet.id).subscribe(
            data => {
              const productBacklog = data;
              localStorage.setItem('productBacklogCourant', JSON.stringify(productBacklog));
              this.router.navigateByUrl('/dashboard');
              this.dialogRef.close()
            },
            error => {
              console.log('Une erreur s\'est produite lors de la récupération du product backlog : ', error);
            }
          );
        }
      })
    }else
    Swal.fire(
      'Clé incorrecte',
      'Veuillez réssayer !',
      'error'
    )
  }

}
