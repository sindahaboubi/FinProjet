import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SprintService } from 'src/app/service/sprint.service';
import { Inject } from '@angular/core';
import { Sprint } from 'src/app/model/sprint';
import { Projet } from 'src/app/model/projet';
import { ToastrService } from 'ngx-toastr';
import { ProductBacklogService } from 'src/app/service/product-backlog.service';

@Component({
  selector: 'app-ajouter-sprint-form',
  templateUrl: './ajouter-sprint-form.component.html',
  styleUrls: ['./ajouter-sprint-form.component.scss']
})
export class AjouterSprintFormComponent {
  constructor(private fb: FormBuilder, private sprintService:SprintService,
    public dialogRef: MatDialogRef<AjouterSprintFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,private toastr: ToastrService,
    private productBacklogService:ProductBacklogService
  ) { }

  form: FormGroup;
  sprints:Sprint[];

  onNoClick(): void {
    this.dialogRef.close();
  }

  getListSprintsByProductBacklog(){
    this.sprintService.getListSprintsByProductBacklog(this.productBacklogService.getProductBacklogByIdFromLocalStorage()).subscribe(
      data => {
          this.sprints = data;
          if(this.sprints.length>0){
            const lastSprint = this.sprints[this.sprints.length - 1];
            const lastDateFin = new Date(lastSprint.dateFin);
            const defaultDateLancement = new Date(lastDateFin.getTime() + 24 * 60 * 60 * 1000);

            this.form = this.fb.group({
              objectif: ['', Validators.required],
              dateLancement: [defaultDateLancement, this.dateSystemValidator()],
              dateFin: ['', this.validateDateFin.bind(this)]
            });
          }else{
            this.form = this.fb.group({
              objectif: ['', Validators.required],
              dateLancement: ['', this.dateSystemValidator()],
              dateFin: ['', this.validateDateFin.bind(this), Validators.required]
            });
          }
      }
    );
  }

  onSave(): void {
    const productBacklogId = this.productBacklogService.getProductBacklogByIdFromLocalStorage();
    const sprint = new Sprint();
    sprint.objectif = this.form.get('objectif').value;
    sprint.dateLancement = new Date(this.form.get('dateLancement').value);
    sprint.dateFin = new Date(this.form.get('dateFin').value);
    const dateDebProjet = new Date(this.getProjetByIdFromLocalStorage().dateDebut);
    const dateFinProjet = new Date(this.getProjetByIdFromLocalStorage().dateFin);
    const conflit = this.sprints.some(existingSprint => {
      const existingSprintDebut = new Date(existingSprint.dateLancement);
      const existingSprintFin = new Date(existingSprint.dateFin);
      return (sprint.dateLancement >= existingSprintDebut && sprint.dateLancement <= existingSprintFin) ||
        (sprint.dateFin >= existingSprintDebut && sprint.dateFin <= existingSprintFin) ||
        (existingSprintDebut >= sprint.dateLancement && existingSprintDebut <= sprint.dateFin) ||
        (existingSprintFin >= sprint.dateLancement && existingSprintFin <= sprint.dateFin);
    });
    if (conflit) {
      this.toastr.error('La période du sprint se chevauche avec un sprint existant.');
      return;
    }
    if (sprint.dateLancement < dateDebProjet || sprint.dateFin > dateFinProjet) {
      this.toastr.error('Veuillez ajouter un sprint dans la période de votre projet !');
      return;
    }
    if (this.sprints.length === 0) {
      const diffTime = Math.abs(sprint.dateFin.getTime() - sprint.dateLancement.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      localStorage.setItem('sprintDuration', diffDays.toString());
    } else {
      const storedDuration = localStorage.getItem('sprintDuration');
      const diffTime = Math.abs(sprint.dateFin.getTime() - sprint.dateLancement.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays !== parseInt(storedDuration)) {
        this.toastr.error('Les sprints doivent être de méme période !');
        return;
      }
    }
    sprint.productBacklogId = productBacklogId;
    this.sprintService.createSprint(sprint, productBacklogId).subscribe(
      (response) => {
        this.toastr.success('Le sprint a été créé avec succès');
        this.dialogRef.close(response);
      },
      (error) => {
        this.toastr.error('Erreur lors de la création du sprint.');
        console.error(error);
      }
    );
  }

  validateDateFin(control: AbstractControl): {[key: string]: any} | null {
    const dateLancement = new Date(control.parent?.get('dateLancement').value);
    const dateFin = new Date(control.value);
    if (dateLancement && dateFin && dateLancement >= dateFin) {
      return { 'dateFinInvalide': true };
    }
    return null;
  }

  dateSystemValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const dateInput = new Date(control.value);
      const dateSystem = new Date(Date.now());
      if (dateInput.getTime() >= dateSystem.getTime()) {
        return null;
      } else {
        return { dateInvalid: true };
      }
    };
  }

  getProjetByIdFromLocalStorage(){
    let projetCourantStr = localStorage.getItem("projet");
    let projetCourantObj:Projet= JSON.parse(projetCourantStr);
    console.log(projetCourantObj);
    return projetCourantObj;
  }

  ngOnInit(): void {
    this.getListSprintsByProductBacklog();
  }


}
