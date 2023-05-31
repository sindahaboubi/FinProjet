import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Membre } from 'src/app/model/membre';
import { Role } from 'src/app/model/role';
import { RoleService } from 'src/app/service/role.service';
import * as Chart from 'chart.js';
import { AuthentificationService } from 'src/app/service/authentification.service';

interface OneMembre{
  membre:Membre
}

@Component({
  selector: 'app-consulet-membre-panel',
  templateUrl: './consulet-membre-panel.component.html',
  styleUrls: ['./consulet-membre-panel.component.scss']
})
export class ConsuletMembrePanelComponent implements OnInit {
  value :number = 0;
  constructor(
    public dialogRef: MatDialogRef<ConsuletMembrePanelComponent>,
    private roleService:RoleService,
    @Inject(MAT_DIALOG_DATA) public data: OneMembre
  ){}
  roles:Role[]=[]
  rolesPo:Role[]=[]
  rolesDev:Role[]=[]
  rolesScrumMaster:Role[]=[];
  decodedPhoto:string;

  ngOnInit(): void {
    console.log('membre = ', this.data.membre)

    this.roleService.afficherListRoleParMembre(this.data.membre.id).subscribe(
      data => {
        this.roles = data
        this.value = data.length
        this.rolesDev = this.roles.filter(role => role.type == 'dev team')
        this.rolesPo = this.roles.filter(role => role.type == 'po')
        this.rolesScrumMaster = this.roles.filter(role => role.type == 'scrum master')
        const ctx = document.getElementById('myChart');
        const myChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Dev Team', 'Product Owner', 'Scrum Master'],
            datasets: [{
              label: 'Number of roles',
              data: [this.rolesDev.length, this.rolesPo.length, this.rolesScrumMaster.length],
              backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)'
              ],
              borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)'
              ],
              hoverOffset: 4,
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false
          }
        });
      }
    )
  }

}
