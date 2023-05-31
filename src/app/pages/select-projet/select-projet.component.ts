import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, Observer } from 'rxjs';
import { ProductBacklog } from 'src/app/model/product-backlog';
import { ProductBacklogService } from 'src/app/service/product-backlog.service';
import { Invitation } from 'src/app/model/invitation';
import { Membre } from 'src/app/model/membre';
import { Projet } from 'src/app/model/projet';
import { Role } from 'src/app/model/role';
import { InvitationService } from 'src/app/service/invitation.service';
import { MembreService } from 'src/app/service/membre.service';
import { ProjetServiceService } from 'src/app/service/projet-service.service';
import { RoleService } from 'src/app/service/role.service';
import Swal from 'sweetalert2';
import { emailValidator, emailExistsValidator,roleExists } from './email-exists.validator';
import { ToastrService } from 'ngx-toastr';
import { MatDialog } from '@angular/material/dialog';
import { ProjetKeyComponent } from '../dialogs/projet-key/projet-key.component';
import { WebSocketInvitationService } from 'src/app/service/web-socket-invitation.service';
import { ChefProjetServiceService } from 'src/app/service/chef-projet-service.service';

export interface ExampleTab {
  label: string;
  content: string;
}

interface Request {
  invitation: Invitation;
  projet: Projet;
}

export interface ClesProjet {
  projet:Projet
}

@Component({
  selector: 'app-select-projet',
  templateUrl: './select-projet.component.html',
  styleUrls: ['./select-projet.component.scss']
})


export class SelectProjetComponent implements OnInit {

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


  emailLocal:string
  valid:boolean=false;
  /*   formulaire d'ajout de projet   */
  projetForm:FormGroup;

  /** les formulaire d'invi et de creation de role */
  invitationForm:FormGroup;
  roleForm:FormGroup;
  rolePkForm:FormGroup ;
  combinedForm:FormGroup;

  ngOnInit(): void {

    this.rolePkForm = this.formBuilder2.group({
      membreId:null,
      projetId:[null,Validators.required]
    })

    this.invitationForm = this.formBuilder2.group({
      chefProjetId:this.chefProjetService.getChefProjetFromToken().id,
      emailInvitee:["",[Validators.required]],
      membreId:null
    })

    this.roleForm = this.formBuilder2.group({
      pk:this.rolePkForm,
      type :["",Validators.required],
      permission :[""],
      description:[""],
      status:"ATTENTE",
      invitation:null
    })


    this.combinedForm = this.formBuilder2.group({
      invitation:this.invitationForm,
      role:this.roleForm
    })
    /*   initialisation de formulaire d'ajout de projet   */
    this.projetForm = this.formBuilder.group({
      nom: ['', Validators.required],
      dateDebut: ['', Validators.required],
      dateFin: ['', Validators.required],
      cles: ['', Validators.required],
      chefProjetId:this.chefProjetService.getChefProjetFromToken().id
    });

    this.projetForm.controls['nom'].valueChanges.subscribe((value: string) => {
      this.projetForm.controls['cles'].setValue(this.generateCles(value));
    });

    /*   liste des projet d'un chef de projet   */
    this.projetService.getListProjetChefProjet(this.chefProjetService.getChefProjetFromToken().id).subscribe(
      data => {
        this.projets = data ;
      }
    )

    this.membreService.afficherTousMembres().subscribe(
      data=>{

         /**test avec invtation list */
      }
    )

    /**les eccouteurs de champ */

    this.rolePkForm.get('membreId').valueChanges.subscribe(
      membreId=>{

        const membre = this.membreList.find(membre => membre.id == membreId)
        this.invitationForm.patchValue({ emailInvitee: membre.email || null });
        this.invitationForm.get('emailInvitee').disable()
        this.invitationForm.patchValue({membreId:membreId || null})
      }
    )

    this.roleForm.get('type').valueChanges.subscribe(
      typeNumber=>{
        //injecter le validateur

        this.roleForm.patchValue({ permission: this.permissionMap.get(typeNumber) || null });
        this.roleForm.patchValue({ description: this.descriptionMap.get(typeNumber) || null });
      }
    )

  }

  generateCles(nom: string): string {
    const words = nom.split(' ');
    const initials = words.map(word => word.charAt(0));
    return initials.join('').toUpperCase();
  }

  projets:Projet[];
  asyncTabs: Observable<ExampleTab[]>;
  /* detail balise */
  panelOpenState = false;
  panelOpenState2 = false;
 /*  end */
  constructor(private projetService: ProjetServiceService,
              private formBuilder: FormBuilder,
              private toastr: ToastrService,
              private keyMatDialogue:MatDialog,
              private formBuilder2: FormBuilder,
              private roleService: RoleService,
              private invitationService: InvitationService,
              private membreService: MembreService,
              private webSocketService:WebSocketInvitationService,
              private productBacklogService:ProductBacklogService,
              private router: Router,
              private chefProjetService:ChefProjetServiceService) {

    this.asyncTabs = new Observable((observer: Observer<ExampleTab[]>) => {
      /*   les type des action gerer par se composant :: les sliders   */
      setTimeout(() => {
        observer.next([
          {label: 'Mes projets', content: 'Content 1'},
          {label: 'Nouveau projet', content: 'Content 2'},
          {label: 'Invitation(s)', content: 'Content 3'},
        ]);
      }, 1000);
    });

  }

/*   un seul projet peut etre gerer en temps real    */
  cocherProjet(index:number){
    this.valid = !this.valid;
    this.projets[index].checked  = !this.projets[index].checked;
  }

/*   boutton gerer de content 1  */
  gerer(index:number){
    const dialogRef = this.keyMatDialogue.open(ProjetKeyComponent,{
      width: '35%',
      height:'20%',
      data: {
        projet:this.projets[index]
      }
    });
  }

  /*   annuler* ou gerer  */
onCancel() {
  this.projetForm.reset();
}

/*   envoyer le formulaire de creation   */
projet:Projet;
onSubmit() {
  console.log(this.projetForm.value);
  this.projetService.ajouterProjetByChef(this.projetForm.value).subscribe(
    projet => {
      this.projet = projet;
      localStorage.setItem('projet', JSON.stringify(this.projet));
      this.projets.push(projet)
      this.toastr.success(`Projet ${projet.nom} ajouter avec succés`);
      this.step = 0
      const productBacklog: ProductBacklog = new ProductBacklog();
      this.productBacklogService.createProductBacklog(productBacklog, this.projet.id).subscribe(
        data => {
          console.log('Product backlog créé avec succès:', data);
        },
        error => {
          console.error('Erreur lors de la création du product backlog:', error);
        }
      );
    },
    error => {
      console.error('Erreur lors de la création du projet:', error);
    }
  );
}


/** passer d un expansion a un autre */
step = 0;
  setStep(index: number) {
    this.step = index;
  }

  nextStep() {
    this.step++;
  }

  prevStep() {
    this.step--;
  }
/** end */

  membreList: Membre[]

  /** liste des membre cocher pour les invité */
  cochedMembre:Membre[]=[];

  allValid(){
    return this.roleForm.valid
    && this.rolePkForm.valid
    && this.invitationForm.valid

  }



  inviter(){
    console.log(this.invitationForm.value);
    console.log(this.combinedForm.get('invitation').value);
    const projetChoisis = this.projets.find(projet => projet.id == this.rolePkForm.get('projetId').value)
    let request:Request = {
      invitation:this.invitationForm.value,
      projet:projetChoisis
    }
    /** a modifier apres l'auth */
    request.invitation.chefProjetId = this.chefProjetService.getChefProjetFromToken().id;
    /** end */
    this.invitationService.envoyerInvitation(request).subscribe(
      data => {
        this.roleForm.get('invitation').setValue(data)
        console.log( this.roleForm.get('invitation').value);
        let role:Role = this.roleForm.value
        role.pk.membreId = data.membreId
        console.log(role);

        this.roleService.ajouterRole(role).subscribe(
          data => {
            console.log("role : "+data);
            this.invitationForm.reset();
            this.rolePkForm.reset();
            this.roleForm.reset();
            this.step = 0
          },
          error => {
            console.log(error);
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

  listNewMembre:Membre[]=[]
  /** recuperer les membre de projet  */
  recupererMembreProjet(){
    /** initialiser */
    this.invitationForm.patchValue({ emailInvitee: "" });
    this.listNewMembre =[]
    this.invitationForm.get('emailInvitee').setValidators([Validators.required,emailValidator])
    const projetId = this.rolePkForm.get('projetId').value
    this.membreService.afficherTousMembres().subscribe(
      data => {
        /** injection validateur membre de email existe dans la base */
        /** end */
        this.roleService.afficherListRoleParProjet(projetId).subscribe(
          dataRoles => {
            //pour les membre qui sont deja la
            this.membreList =data.filter(membre=> membre.id != dataRoles.find(role => role.pk.membreId == membre?.id)?.pk.membreId)
            //si il n ya pas de membre
            this.listNewMembre = data.filter(
              membre => membre.email == dataRoles.find(role => role.membre.email == membre.email)?.membre.email
            )
            console.log(this.listNewMembre);

            //injection de validateur de role
            this.roleForm.get('type').setValidators([Validators.required,roleExists(dataRoles)])

            if (this.listNewMembre.length > 0)
            //ken lista akber men  0 ninjecti fiha les validateur
              this.invitationForm.get('emailInvitee').setValidators([emailExistsValidator(this.listNewMembre),Validators.required,emailValidator]);
          }
        )
      }
    )
  }


  resetInvitation(){
    this.roleForm.reset()
    this.invitationForm.reset()
  }

}
