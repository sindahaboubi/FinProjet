import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Chart, ChartData, ChartOptions } from 'chart.js';
import { Projet } from "src/app/model/projet";
import { Sprint } from "src/app/model/sprint";
import { TicketHistoire } from "src/app/model/ticket-histoire";
import { HistoireTicketService } from "src/app/service/histoire-ticket.service";
import { ProductBacklogService } from "src/app/service/product-backlog.service";
import { ProjetServiceService } from "src/app/service/projet-service.service";
import { SprintService } from "src/app/service/sprint.service";
import { TicketTacheService } from "src/app/service/ticket-tache.service";
import Swal from "sweetalert2";

@Component({
  selector: "app-dashboard",
  templateUrl: "dashboard.component.html",
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  public canvas : any;
  public ctx;
  public datasets: any;
  public data: any;
  public myChartData;
  public clicked: boolean = true;
  public clicked1: boolean = false;
  public clicked2: boolean = false;

  //Pour la deuxième courbe
  sprintsProjet:Sprint[];
  tickets:TicketHistoire[]=[];
  @ViewChild('myChart', { static: true }) myChart: ElementRef;


  constructor(private sprintService:SprintService,
    private ticketTacheService:TicketTacheService,
    private productBacklogService:ProductBacklogService,
    private histoireTicketService:HistoireTicketService, private projetService:ProjetServiceService) {}
    sprints: Sprint[]=[];
    chart: Chart;
    sprintSelectedIndex:number;
    projet:Projet;

    ngOnInit() {
      const storedObject = localStorage.getItem("projet");
      const parsedObject = JSON.parse(storedObject);
      this.projet = parsedObject;

      this.sprintService.getListSprintsByProductBacklog(this.productBacklogService.getProductBacklogByIdFromLocalStorage()).subscribe((sprints: Sprint[]) => {
        if (sprints.length > 0) {
          const firstSprint = sprints[0];
          const diffTime = Math.abs(new Date(firstSprint.dateFin).getTime() - new Date(firstSprint.dateLancement).getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          localStorage.setItem('sprintDuration', diffDays.toString());

          this.sprintSelectedIndex=0;
          this.sprints = sprints;

        if(this.sprints.length!=0){
        for (let i = 0; i < this.sprints.length; i++) {
          const sprint = this.sprints[i];

          this.histoireTicketService.getHistoireTicketBySprintId(sprint?.id).subscribe((tickets: TicketHistoire[]) => {

            const labels = [];
            const data = [];
            let remainingEffort = sprint.velocite;
            labels.push(new Date(sprint.dateLancement).setHours(0, 0, 0, 0));
            data.push(remainingEffort);

            for (let j = 0; j < tickets.length; j++) {
              remainingEffort -= tickets[j].effort;
              labels.push(new Date(tickets[j].dateFin).setHours(0, 0, 0, 0));

              data.push(remainingEffort);
            }
            labels.push(new Date(sprint.dateFin).setHours(0, 0, 0, 0));
            data.push(0);

            const chart = new Chart(`canvas-${sprint?.id}`, {
              type: 'line',
              data: {
                labels: labels,
                datasets: [
                  {
                    label: 'Effort restant',
                    data: data,
                    borderColor: 'orange',
                    fill: false
                  },
                  {
                    label: 'Tendance idéale',
                    data: this.generateIdealTrend(sprint),
                    borderColor: '#00d6b4',
                    fill: false
                  }
                ]
              },
              options: {
                title: {
                  display: true,
                  text: `Burn Down Chart`,
                  fontSize: 20,
                  fontColor: 'black'
                },
                responsive: true,
                scales: {
                  xAxes: [{
                    type: 'time',
                    time: {
                      unit: 'day',
                      tooltipFormat: 'll'
                    },

                    scaleLabel: {
                      display: true,
                      labelString: 'Jours de sprint',
                      fontColor: 'black',
                      fontSize:14
                    },
                    ticks: {
                      beginAtZero: true,
                      stepSize:1
                    },
                  }],
                  yAxes: [{
                    ticks: {
                      beginAtZero: true,
                      stepSize: 1,
                    },
                    scaleLabel: {
                      display: true,
                      labelString: 'Effort restant (points)',
                      fontColor: 'black',
                      fontSize: 14
                    }
                  }]
                }
              }
            });
          });
        }
      }
      }
      /** terminer sprint */
            const sprintEnCours = sprints.find(sprint => sprint.etat == "en cours")
            if(sprintEnCours){
              sprintEnCours.productBacklogId = sprintEnCours.productBacklog.id
              if(this.verifDate(sprintEnCours.dateFin) && sprintEnCours.etat!="termine"){
                this.histoireTicketService.getHistoireTicketBySprintId(sprintEnCours.id).subscribe(
                  listeHistoireData =>{
                    if(!this.verifListTicketDone(listeHistoireData)){
                      const sprintSuivant = this.sprintSuivant(sprints,sprintEnCours)
                      if(sprintSuivant){
                        Swal.fire({
                          title: "ce Sprint se termine aujourd'hui voulez voulez vous\n transferer les tikcets histoire restant dans \le sprint suivant ",
                          icon: 'warning',
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
                            // Le code à exécuter si l'utilisateur a cliqué sur "Oui, supprimer!"
                            this.transferDeTicket(sprintSuivant,listeHistoireData)
                            sprintEnCours.etat = "termine"
                            this.sprintService.modifierSprint(sprintEnCours).subscribe(
                              data => {
                                Swal.fire(
                                  'Bravo !!',
                                  'Sprint termné',
                                  'success'
                                )
                              }
                            )
                          }else{
                            sprintEnCours.etat = "termine"
                            this.sprintService.modifierSprint(sprintEnCours).subscribe(
                              data => {
                                Swal.fire(
                                  'Domage!!',
                                  'Sprint termné mais non pas pour tous ses ticket histoire !',
                                  'warning'
                                )
                              }
                            )
                          }
                        });

                      }else{
                        sprintEnCours.etat = "termine"
                        this.sprintService.modifierSprint(sprintEnCours).subscribe(
                          data => {
                            Swal.fire(
                              'Domage!!',
                              'Sprint termné mais non pas pour tous ses ticket histoire !',
                              'warning'
                            )
                          }
                        )
                      }
                    }else{
                      sprintEnCours.etat = "termine"
                            this.sprintService.modifierSprint(sprintEnCours).subscribe(
                              data => {
                                Swal.fire(
                                  'Bravo !!',
                                  'Sprint termné',
                                  'success'
                                )
                              }
                            )
                    }
                  }
                )
              }
            }


    //}

  }

  );

    this.histoireTicketService.getListHistoireTicketByProductBacklog(this.productBacklogService.getProductBacklogByIdFromLocalStorage()).subscribe(
      data => {
          this.tickets = data;
          console.log(this.tickets);

          this.tickets.sort((a, b) => {
            if (a.dateFin > b.dateFin) {
              return 1;
            } else if (a.dateFin < b.dateFin) {
              return -1;
            } else {
              return 0;
            }
          });

          console.log(this.tickets);
      },
      error => {
        console.log(error);
      }
    );


    this.sprintService.getListSprintsByProductBacklog(this.productBacklogService.getProductBacklogByIdFromLocalStorage()).subscribe(
      data => {
        if (data.length > 0) {
          this.sprintsProjet = data;
          console.log(this.sprintsProjet);
        } else {
          console.log('Pas de sprints !');
        }
        const myChart = new Chart(this.myChart.nativeElement.getContext('2d'), {
          type: 'line',
          data: this.getChartData(),
          options: this.getChartOptions()
        });
      },
      error => {
        console.log(error);
      }
    );





  }

    onSprintSelected(index: number) {
      if(this.sprints && this.sprints.length>0){
        this.sprintSelectedIndex = index;
      }
    }

  public updateOptions() {
    this.myChartData.data.datasets[0].data = this.data;
    this.myChartData.update();
  }

  private generateIdealTrend(sprint: Sprint): any[] {
    const idealTrend = [];
    const dateLancement = new Date(sprint.dateLancement);
    const dateFin = new Date(sprint.dateFin);

    dateLancement.setHours(0, 0, 0, 0); // Réinitialiser les heures, minutes et secondes à zéro
    console.log('Date = '+dateLancement)
    idealTrend.push({ x: dateLancement, y: sprint.velocite });

    dateFin.setHours(0, 0, 0, 0); // Réinitialiser les heures, minutes et secondes à zéro
    idealTrend.push({ x: dateFin, y: 0 });
    idealTrend.push({ x: sprint.dateLancement, y: sprint.velocite });
    idealTrend.push({ x: sprint.dateFin, y: 0 });
    return idealTrend;
  }

  //Pour la deuxième courbe
  getChartData(): ChartData {
    const ctx = this.myChart.nativeElement.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 230, 0, 50);

    gradient.addColorStop(1, 'rgba(233,32,16,0.2)');
    gradient.addColorStop(0.4, 'rgba(233,32,16,0.0)');
    gradient.addColorStop(0, 'rgba(233,32,16,0)'); //red colors

    if(this.sprintsProjet && this.sprintsProjet.length>0){
      const labels = this.sprintsProjet.map((sprint, index) => 'Sprint' + (index + 1));
      labels.unshift('0');

      const data = {
      labels: labels,
      datasets: [
        {
          pointHoverRadius: 6,
          pointBorderWidth: 1.5,
          pointHoverBackgroundColor: 'gray',
          label: 'Effort terminé',
          data: this.getScopeCreepData(),
          fill: false,
          borderWidth: 2,
          borderDash: [],
          borderDashOffset: 0.0,
          backgroundColor: gradient,
          pointBackgroundColor: '#FC836B',
          pointBorderColor: '#FC836B',
          borderColor: '#FC836B'
        },
        {
          label: 'Effort planifié',
          data: this.getEffortPlanifieData(),
          fill: false,
          borderWidth: 2,
          borderDash: [],
          borderDashOffset: 0.0,
          borderColor: '#64FF25',
          pointBorderWidth: 1.5,
          pointBackgroundColor: '#64FF25',
          pointBorderColor: '#64FF25'
        }]};
        return data;
    }

    }

    getScopeCreepData() {
      const scopeCreepData: number[] = [];
      scopeCreepData.push(0);
      let scopeCreepTotal = 0;
        for (const sprint of this.sprintsProjet) {
          const userStoriesInSprint = this.tickets.filter(us => us.sprintId === sprint?.id);
          const scopeCreepInSprint = userStoriesInSprint.reduce((acc, us) => acc + (us.effort * (us.status === 'TERMINE' ? 1 : 0)), 0);
          scopeCreepTotal = scopeCreepTotal + scopeCreepInSprint;
          scopeCreepData.push(scopeCreepTotal);
        }
      return scopeCreepData;
    }

    getEffortPlanifieData(){
      if(this.sprintsProjet && this.sprintsProjet.length>0){
        const effortPlanifieData: number[] = [];
        effortPlanifieData.push(0)
        let effortPlanifieTotal = 0;
        for (const sprint of this.sprintsProjet) {
          effortPlanifieTotal += sprint.velocite;
          effortPlanifieData.push(effortPlanifieTotal);
        }
        return effortPlanifieData;
      }
    }

    getChartOptions(): ChartOptions {
      return {
      responsive: true,
        tooltips: {
          backgroundColor: '#f5f5f5',
          titleFontColor: '#333',
          bodyFontColor: '#666',
          bodySpacing: 4,
          xPadding: 14,
          mode: "nearest",
          intersect: 0,
          position: "nearest"
        },
      title: {
        display: true,
        text: 'Burn-up chart',
        fontSize: 20,
        fontColor: 'black'
      },
      scales: {
      xAxes: [{
        scaleLabel: {
          display: true,
          labelString: 'Sprints',
          fontColor: 'black',
          fontSize: 14
        }
      }],
      yAxes: [
        {
        scaleLabel: {
          display: true,
          labelString: 'Efforts (en points )',
          fontColor: 'black',
          fontSize: 14
        },
        ticks: {
          beginAtZero: true,
        }
      }]
      }
      };
  }

  verifDate(dateRec:Date){
    const aujourdhui = new Date()
    dateRec= new Date(dateRec)
    return  dateRec.getFullYear() === aujourdhui.getFullYear() &&
    dateRec.getMonth() === aujourdhui.getMonth() &&
    dateRec.getDate() === aujourdhui.getDate()
  }

  verifListTicketDone(liste:TicketHistoire[]){
    const doneList = liste.filter(histoire => histoire.status == "TERMINE")
    return doneList.length == liste.length
  }

  sprintSuivant(liste:Sprint[],sprintActuelle:Sprint):Sprint{
    if(liste.indexOf(sprintActuelle) == liste.length - 1)
      return null
    else
      return liste[liste.indexOf(sprintActuelle)+1]
  }

  transferDeTicket(sprint:Sprint,listeHistoire:TicketHistoire[]){
     const listeHistoireEnAttente = listeHistoire.filter(histoire => histoire.status == "EN_COURS")
     for(let histoire of listeHistoireEnAttente){
      this.histoireTicketService.assignUserStoryToSprint(histoire.id,sprint.id).subscribe(
        data => {
          Swal.fire(
            'Transfers aquis',
            'les ticket en bien ete transmis',
            'success'
          )
        }
      )
      /** reglage de tâche */
      this.ticketTacheService.getListTicketTacheParHt(histoire.id).subscribe(
        listeTacheData =>{
            for(let tache of listeTacheData){
              tache.sprintBacklogId = null
              this.ticketTacheService.modifierTicketTache(tache).subscribe(
                data => console.log(data)
              )
            }
        }
      )
      /** end */
     }
  }
}
