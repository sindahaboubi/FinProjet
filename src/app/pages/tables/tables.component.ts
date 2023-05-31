import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import * as JSZip from "jszip";
import { ToastrService } from "ngx-toastr";
import { Dossier } from "src/app/model/dossier";
import { Membre } from "src/app/model/membre";
import { Role } from "src/app/model/role";
import { AntiVerusService } from "src/app/service/anti-verus.service";
import { AuthentificationService } from "src/app/service/authentification.service";
import { DossierService } from "src/app/service/dossier.service";
import { MembreService } from "src/app/service/membre.service";
import { ProjetServiceService } from "src/app/service/projet-service.service";
import { WebSocketDossierService } from "src/app/service/web-socket-dossier.service";
import Swal from "sweetalert2";


@Component({
  selector: "app-tables",
  templateUrl: "tables.component.html",
  styleUrls: ['./tables.component.scss'],
})
export class TablesComponent implements OnInit {

  zip:JSZip=new JSZip();
  formData:FormData = new FormData();
  folderName:string;
  verus:boolean=true
  projetDos:Dossier[]=[];
  constructor(
    private toastr: ToastrService,
    private dossierService:DossierService,
    private antiVerusService:AntiVerusService,
    private router: Router,
    private webSocketService:WebSocketDossierService,
    private membreService:MembreService,
    private authentificationService:AuthentificationService,
    private projetService:ProjetServiceService
  ) {
    this.webSocketService.messageHandlingAddDos(null).subscribe(
      message => {
        if(message.subscribe && message.subscribe.projetId == JSON.parse(localStorage.getItem('projet')).id )
         this.projetDos.push(message.subscribe)
      }
    )
    this.webSocketService.messageHandlingSupprimerDos(null).subscribe(
      message => {
        console.log(message);
        if(message.supprimer && this.projetDos.find(dos => dos.id == message.supprimer.id) && message.supprimer.projetId == JSON.parse(localStorage.getItem('projet')).id )
         this.projetDos.splice(this.projetDos.indexOf(this.projetDos.find(dos => dos.id == message.supprimer.id)),1)
      }
    )

  }
  membre:Membre;
  role:string;
  ngOnInit() {
    if(this.authentificationService.getUserRolesToken(sessionStorage.getItem('token')).roles.includes('chefProjet')){
      this.role='chefProjet';
    }else{
      const roleToken = this.authentificationService.getUserRolesToken(sessionStorage.getItem('token')).roles as Role[]
      this.role = roleToken.find(role =>
         role.pk.membreId == this.membreService.getMembreFromToken().id
         && role.pk.projetId == this.projetService.getProjetFromLocalStorage().id).type
    }

    this.membre = this.membreService.getMembreFromToken();
    this.folderName = ""
    const projet = JSON.parse(localStorage.getItem('projet'))
    this.dossierService.recupererDossierDeProjet(projet.id).subscribe(
      data => {
        if(data)
         this.projetDos = data
        console.log(data);

      },
      error =>{

      }
    )
  }

  dos:Dossier
  onFileChange(event){
    const files = event.target.files;
    this.folderName = files[0].webkitRelativePath.split('/')[0];
    let totalSize = 0;
    for (let i = 0; i < files.length; i++) {
      totalSize += files[i].size;
    }

    if (totalSize >  30000000) {
      console.log("error");
      this.toastr.error("Ce fichier contient plus de 300MB")
      event.target.value = '';
    }else{
      const folderNameDiv = document.getElementById("folderName");
      const folderDiv = document.getElementById("folder");

      folderDiv.classList.add("has-files")
      folderNameDiv.innerHTML = "Nom du dossier : "+this.folderName
      for(let file of files){
        const path = file.webkitRelativePath.split(`${this.folderName}/`)[1];
        this.zip.file(path,file)
      }
      this.antiVerusService.checkVerus(this.zip).then(
        response => {
          this.antiVerusService.getReport().subscribe(
            resultat => {
              if (resultat.data.attributes.stats.malicious > 0) {
                this.toastr.error("Un virus a été détecté !! \nAttention à ce que vous mettez dans l'application !");
                this.reloadPage()
              } else {
                this.toastr.success("Dossier sain.");
                this.verus = false;
              }
            }
          );
        }
      );
    }
  }
  reloadPage() {
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([this.router.url]);
    });
  }

  uploadDos(){
    this.zip.generateAsync({type:'blob'}).then( content =>{
      const formData = new FormData();
      formData.append("compressedFile",content,`${this.folderName}.zip`)
      /** appel au service Dossier */
      const dossier:Dossier = {
        projetId:JSON.parse(localStorage.getItem('projet')).id,
        membreId:this.membreService.getMembreFromToken().id,
        donnees:formData,
        nomDossier:this.folderName,
      }
      this.dossierService.sauvegarderDossier(dossier).subscribe(
        data => {
          if(data)
           this.webSocketService.messageHandlingAddDos(data).subscribe(
            (message) => {
              // afficher le message reçu dans la console
              console.log(message);

            },
            (err) => {
              console.error(err); // afficher les erreurs dans la console
            },
            () => {
              console.log('WebSocket connection closed'); // afficher un message lorsque la connexion est fermée
            }
           )
        },
        error => {
          this.toastr.error("Vous avez déjà importé le même dossier !")
        }
      )

      /** end */
   })
  }


  supprimerDossier(dossier:Dossier){
    Swal.fire({
      title: "Clé correcte, vous êtes sûr de supprimer le dossier : "+dossier.nomDossier+" ?",
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, Supprimer',
      cancelButtonText: 'Annuler',
      background:'rgba(0,0,0,0.9)',
      backdrop: 'rgba(0,0,0,0.4)',
      allowOutsideClick: false,
      allowEscapeKey: false,
      allowEnterKey: false,
      focusConfirm: false
    }).then((result) => {
      if (result.isConfirmed) {
        this.dossierService.supprimerDos(dossier.id).subscribe(
          data => {
            //this.projetDos.splice(this.projetDos.indexOf(this.projetDos.find(dos => dos.id == dossier.id)),1)
            this.webSocketService.messageHandlingSupprimerDos(dossier).subscribe(
              message => {
                console.log(message);
              }
            )
          },
          error => {
            Swal.fire(
              'Erreur',
              'Suppression impossible ',
              'error'
            )
          }
        )
      }
    })

  }


}
