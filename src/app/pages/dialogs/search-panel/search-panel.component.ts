import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Observable, map, startWith } from 'rxjs';
import { Membre } from 'src/app/model/membre';
import Swal from 'sweetalert2';
import { ConsuletMembrePanelComponent } from '../consulet-membre-panel/consulet-membre-panel.component';

interface recherche{
  membres:Membre[]
}

@Component({
  selector: 'app-search-panel',
  templateUrl: './search-panel.component.html',
  styleUrls: ['./search-panel.component.scss']
})
export class SearchPanelComponent implements OnInit {


  chercher:FormControl = new FormControl("",Validators.required);
  filteredOptions: Observable<string[]>;
  emails:string[]

  constructor( public dialogRef: MatDialogRef<SearchPanelComponent>,
              @Inject(MAT_DIALOG_DATA) public data: recherche,
              private consulterMembre:MatDialog
              ){}

  ngOnInit(): void {
    this.emails = this.data.membres.map(membre => membre.email)
    this.filteredOptions = this.chercher.valueChanges.pipe(
      startWith(''),
      map(emailEcris => this._filter(emailEcris ||'')),
    );
  }

  private _filter(email: string): string[] {
    const filterValue = email.toLowerCase();
    const dernierValeur = email[email.length-1]
    return this.emails.filter(email =>
       (email.toLowerCase().indexOf(dernierValeur) == filterValue.indexOf(dernierValeur))
       &&
       email.toLowerCase().includes(filterValue)
       );
  }

  chercherMembre(){
    if(this.chercher.valid){
      console.log('test = ',this.chercher.value);
      const membre = this.data.membres.find(membre => membre.email == this.chercher.value)
      if(membre){
        this.consulterMembre.open(ConsuletMembrePanelComponent,{
          width: '80%',
          height:'80%',
          position: {
            top: '95px',
          },
          data: {
            membre:membre
          }
        });
        this.dialogRef.close()
      }else{
        Swal.fire(
          'Attention',
          'aucun membre avec ce mail',
          'info'
        ).then(() => this.dialogRef.close())
      }
    }


    }

}
