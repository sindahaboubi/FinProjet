import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ChefProjet } from 'src/app/model/chef-projet';
import { Membre } from 'src/app/model/membre';
import { Role } from 'src/app/model/role';
import { AuthentificationService } from 'src/app/service/authentification.service';
import { ChefProjetServiceService } from 'src/app/service/chef-projet-service.service';
import { MembreService } from 'src/app/service/membre.service';
import { ProjetServiceService } from 'src/app/service/projet-service.service';
import * as bcrypt from 'bcryptjs';

@Component({
  selector: 'app-modifier-profile',
  templateUrl: './modifier-profile.component.html',
  styleUrls: ['./modifier-profile.component.scss']
})
export class ModifierProfileComponent implements OnInit {
  role:string;
  membre:Membre;
  chefProjet:ChefProjet;
  userRolesToken:any;
  modifChefProjetForm:FormGroup;
  inputsDesactives = true;
  btnHidden = true;
  modifMembreForm:FormGroup;


  constructor(
    private authService:AuthentificationService,
    private membreService:MembreService,
    private projetService:ProjetServiceService,
    private chefProjetService: ChefProjetServiceService,
    private fb:FormBuilder,
    private snackBar: MatSnackBar,
      ){}

  public base64Image: string;

  ngOnInit(){
    this.userRolesToken = this.authService.getUserRolesToken(sessionStorage.getItem('token'));
    if (this.userRolesToken.roles.includes('chefProjet')) {
      this.role = 'chefProjet';
      this.base64Image = 'data:image/jpeg;base64,' + this.arrayBufferToBase64(this.userRolesToken.chefProjet.photo);

      this.modifChefProjetForm = this.fb.group({
        id:this.userRolesToken.chefProjet.id,
        nom: [this.userRolesToken.chefProjet.nom],
        prenom: [this.userRolesToken.chefProjet.prenom],
        email: [this.userRolesToken.chefProjet.email],
        username: [this.userRolesToken.chefProjet.username],
        adresse: [this.userRolesToken.chefProjet.adresse],
        telephone: [this.userRolesToken.chefProjet.telephone],
        dateInscription: [this.userRolesToken.chefProjet.dateInscription],
        pwd: [""],
        photo: [null]
      });
    } else {
      const roleToken = this.userRolesToken.roles as Role[];
      this.role = roleToken.find(role =>
        role.pk.membreId == this.membreService.getMembreFromToken().id &&
        role.pk.projetId == this.projetService.getProjetFromLocalStorage().id).type;

        console.log('Membre = ',this.userRolesToken.membre);

        this.base64Image = 'data:image/jpeg;base64,' + this.arrayBufferToBase64(this.userRolesToken.membre.photo);

        this.modifMembreForm = this.fb.group({
          id:this.userRolesToken.membre.id,
          nom: [this.userRolesToken.membre.nom],
          prenom: [this.userRolesToken.membre.prenom],
          email: [this.userRolesToken.membre.email],
          username: [this.userRolesToken.membre.username],
          adresse: [this.userRolesToken.membre.adresse],
          telephone: [this.userRolesToken.membre.telephone],
          dateInscription: [this.userRolesToken.membre.dateInscription],
          pwd: [""],
          photo: [null],
          status:[this.userRolesToken.membre.status]
        });
    }
  }

  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  chefProjetModified:ChefProjet;

  modifierChefProjet() {
    const password = this.modifChefProjetForm.get('pwd').value;


    if (password.length > 0) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      this.modifChefProjetForm.patchValue({ pwd: hashedPassword });

      console.log('mdp = ', password);
      console.log('longueur = ',password.length)

    } else {
      this.modifChefProjetForm.patchValue({ pwd: this.userRolesToken.chefProjet.pwd });
      console.log('pwd = ', password)
    }


         // Convert sysImage to bytes
    // const base64 = this.modifChefProjetForm.get('photo').value;
    const base64 = this.arrayBufferToBase64(this.byteTab);
    console.log('photo = ',base64);
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }

    console.log('test = ',byteArray);
    // Assign byteArray to photo field in chefProjetFormGroup
    this.modifChefProjetForm.patchValue({
      photo: byteArray
    });


    console.log('initial = ',this.modifChefProjetForm.value);
    this.chefProjetModified = {
      ...this.modifChefProjetForm.value
    };

    if(this.chefProjetModified.photo){
      const byteArray = new Array(this.chefProjetModified.photo.length);
      for (let i = 0; i < this.chefProjetModified.photo.length; i++) {
        byteArray[i] = this.chefProjetModified.photo[i];
      }
      this.chefProjetModified.photo = byteArray;
     }

    this.chefProjetService.modifierChefProjet(this.chefProjetModified).subscribe(
      data => {
        const modifData = {
          chefProjet: this.modifChefProjetForm.value,
        };
        this.snackBar.open('Votre profil est mis à jour.', 'Fermer', {
          duration: 4000,
        });
        console.log(this.modifChefProjetForm.value)

        this.activerInputs();
      },
      error => {
        console.log('Erreur !');
      }
    );
  }


  membreModified:Membre;

  modifierMembre() {
    const password = this.modifMembreForm.get('pwd').value;


    if (password.length > 0) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      this.modifMembreForm.patchValue({ pwd: hashedPassword });
    } else {
      this.modifMembreForm.patchValue({ pwd: this.userRolesToken.membre.pwd });
      console.log('pwd = ', password)
    }
    const base64 = this.arrayBufferToBase64(this.byteTab);
    const byteCharacters = atob(base64);
    const byteArray = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteArray[i] = byteCharacters.charCodeAt(i);
    }

    this.modifMembreForm.patchValue({
      photo: byteArray
    });


    console.log('initial = ',this.modifMembreForm.value);
    this.membreModified = {
      ...this.modifMembreForm.value
    };

    if(this.membreModified.photo){
      const byteArray = new Array(this.membreModified.photo.length);
      for (let i = 0; i < this.membreModified.photo.length; i++) {
        byteArray[i] = this.membreModified.photo[i];
      }
      this.membreModified.photo = byteArray;
     }

    this.membreService.modifierMembre(this.membreModified).subscribe(
      data => {
        const modifData = {
          membre: this.modifMembreForm.value,
        };
        this.snackBar.open('Votre profil est mis à jour.', 'Fermer', {
          duration: 4000,
        });
        console.log(this.modifMembreForm.value)

        this.activerInputs();
      },
      error => {
        console.log('Erreur !');
      }
    );
  }


  activerInputs() {
    this.inputsDesactives = !this.inputsDesactives;
    this.btnHidden = !this.btnHidden;
  }

  byteTab:Uint8Array;
  onPhotoSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);

        if(this.role=='chefProjet'){
          this.modifChefProjetForm.patchValue({ photo: uint8Array });
        }else{
          this.modifMembreForm.patchValue({ photo: uint8Array });
        }
        this.byteTab = uint8Array;
        this.base64Image = 'data:image/jpeg;base64,' + this.arrayBufferToBase64(uint8Array);
      };
      reader.readAsArrayBuffer(file);
    }
  }

}
