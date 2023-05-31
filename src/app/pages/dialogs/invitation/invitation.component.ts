import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { InvitationPanel } from 'src/app/components/navbar/navbar.component';
import { Invitation } from 'src/app/model/invitation';
import { Membre } from 'src/app/model/membre';
import { Projet } from 'src/app/model/projet';
import { Role } from 'src/app/model/role';
import { InvitationService } from 'src/app/service/invitation.service';
import { MembreService } from 'src/app/service/membre.service';
import { RoleService } from 'src/app/service/role.service';
import Swal from 'sweetalert2';
import { roleExists } from '../../select-projet/email-exists.validator';
import { ChefProjetServiceService } from 'src/app/service/chef-projet-service.service';

interface Request {
  invitation: Invitation;
  projet: Projet;
}

@Component({
  selector: 'app-invitation',
  templateUrl: './invitation.component.html',
  styleUrls: ['./invitation.component.scss']
})
export class InvitationComponent implements OnInit {

  permissionMap=new Map<string,string>([
    ["dev team","droit de lecture et ecriture sur le sprint ansi que sprintBacklog et les ticket tâche "],
    ["po","droit d'ecriture et lecture sur le product backlog et les ticket histoire"],
    ["scrum master","droit de lecture sur les backlogs la possibiliter de lancer des meeting "]
  ]);
  descriptionMap=new Map<string,string>([
    ["dev team","vous êtes un des membre chargé\n de realiser des increment potentiellement livrable chaque\nsprint"],
    ["po","vous êtes le professionnel responsable\nde maximiser la valeur du produit\nrésultant du travail de l'équipe \nde développement ou, en d'autres\n termes, de maximiser la valeur\n pour le projet"],
    ["scrum master","vous êtes chargé d'assurer que\nScrum est compris et mis en œuvre. "]
  ]);



  constructor(
    public dialogRef: MatDialogRef<InvitationComponent>,
    private membreService: MembreService,
    private invitationService: InvitationService,
    private roleService:RoleService,
    private fb:FormBuilder,
    private chefProjetService:ChefProjetServiceService,
    @Inject(MAT_DIALOG_DATA) public data:InvitationPanel ,
  ){}
  invitationForm:FormGroup;
  roleForm:FormGroup;
  rolePkForm:FormGroup ;
  combinedForm:FormGroup;
  membreList:Membre[]



  ngOnInit(): void {

    this.membreService.afficherTousMembres().subscribe(
      data => {
        this.roleService.afficherListRoleParProjet(this.data.projet.id).subscribe(
          dataRoles => {

            this.roleForm.get('type').setValidators([Validators.required,roleExists(dataRoles)])
            this.membreList =data.filter(membre=> membre.id != dataRoles.find(role => role.pk.membreId == membre?.id)?.pk.membreId)
          }
        )
      }
    )

    this.rolePkForm = this.fb.group({
      membreId:[null,Validators.required],
      projetId:this.data.projet.id
    })

    this.invitationForm = this.fb.group({
      chefProjetId:this.chefProjetService.getChefProjetFromToken().id,
      emailInvitee:"",
      membreId:null
    })

    this.roleForm = this.fb.group({
      pk:this.rolePkForm,
      type :["",Validators.required],
      permission :"",
      description:"",
      status:"ATTENTE",
      invitation:null
    })


    this.combinedForm = this.fb.group({
      invitation:this.invitationForm,
      role:this.roleForm
    })

    this.rolePkForm.get('membreId').valueChanges.subscribe(
      membreId=>{
        const membre = this.membreList.find(membre => membre.id == membreId)
        this.invitationForm.patchValue({ emailInvitee: membre.email || null });
        this.invitationForm.patchValue({membreId:membreId || null})
      }
    )

    this.roleForm.get('type').valueChanges.subscribe(
      typeNumber=>{
        this.roleForm.patchValue({ permission: this.permissionMap.get(typeNumber) || null });
        this.roleForm.patchValue({ description: this.descriptionMap.get(typeNumber) || null });
      }
    )


  }


  allValid(){
    return this.roleForm.valid
    && this.rolePkForm.valid
    && this.invitationForm.valid
  }

  inviter(){
    const projetChoisis = this.data.projet
    let request:Request = {
      invitation:this.invitationForm.value,
      projet:projetChoisis
    }
    this.invitationService.envoyerInvitation(request).subscribe(
      data => {
        this.roleForm.get('invitation').setValue(data)
        console.log(this.roleForm.get('invitation').value);
        let role:Role = this.roleForm.value
        role.pk.membreId = data.membreId
        this.roleService.ajouterRole(role).subscribe(
          data => {
            console.log("role : "+data);
            this.dialogRef.close()
          },
          error => {
            this.invitationService.supprimerInvitation(data.id).subscribe(
              data => console.log(data),
              errorSupp => console.log(errorSupp)
            )
            Swal.fire(
              'Invitation annulée',
              'Une erreur est servenue Lors de l\'invitation, peut être que vous avez déjà invité ce membre pour ce projet',
              'error',
            )
          }
        )
      }
    )
    Swal.fire(
      'Félicitation',
      'Invitation Envoiyée',
      'success',
    )

  }

}
