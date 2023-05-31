import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import 'dhtmlx-gantt';
import { gantt } from 'dhtmlx-gantt';
import { Sprint } from 'src/app/model/sprint';
import { TacheTicket } from 'src/app/model/tache-ticket';
import { TicketHistoire } from 'src/app/model/ticket-histoire';
import { HistoireTicketService } from 'src/app/service/histoire-ticket.service';
import { ProductBacklogService } from 'src/app/service/product-backlog.service';
import { ProjetServiceService } from 'src/app/service/projet-service.service';
import { SprintService } from 'src/app/service/sprint.service';
import { TicketTacheService } from 'src/app/service/ticket-tache.service';
import { Chart } from 'chart.js';
import { HttpClient } from '@angular/common/http';
import { Projet } from 'src/app/model/projet';

@Component({
  selector: 'app-courbes',
  templateUrl: './courbes.component.html',
  styleUrls: ['./courbes.component.scss']
})


export class CourbesComponent implements OnInit {

  constructor(private sprintService:SprintService,
    private productBacklogService:ProductBacklogService,
    private ticketService:HistoireTicketService,
    private ticketTacheService: TicketTacheService,
    private projetService:ProjetServiceService) { }

  sprints: Sprint[] = [];
  projet:Projet;
  dateDebutProjet:Date=new Date(this.projetService.getProjetFromLocalStorage().dateDebut);
  dateFinProjet:Date=this.projetService.getProjetFromLocalStorage().dateFin;

  ngOnInit(): void {
    this.projet =JSON.parse(localStorage.getItem("projet"));
    this.sprintService.getListSprintsByProductBacklog(this.productBacklogService.getProductBacklogByIdFromLocalStorage()) // appel du service en utilisant l'id du product backlog
      .subscribe((data: Sprint[]) => {
        this.sprints = data;
        console.log(this.sprints);
        this.afficherDiagramme();
      });
  }

  afficherDiagramme() {
    gantt.config.scale_unit = 'day';
    gantt.config.date_scale = '%Y-%m-%d';
    gantt.config.task_date = '%Y-%m-%d';
    gantt.config.grid_width = 250;

    gantt.config.columns = [
      {name: "text", label: "N° sprint", tree: true, width: '*', resize: true},
      {name: "etat", label: "Etat", align: "center", width: '70', resize: true},
    ];

    gantt.config.start_date = new Date(this.dateDebutProjet);
    gantt.config.end_date = new Date(this.dateFinProjet);

    gantt.templates.task_text = function(start, end, task) {
      if (task.$level === 0) {
        if (task.state === "terminé") {
          return `${task.text} <i class="fa-solid fa-circle-check" style="color:#626262; font-size:20px; float:right; padding:2px; padding-top:4px"></i>`;
        } else if (task.state === "en cours") {
          return `${task.text} <i class="fa-solid fa-spinner fa-beat-fade" style="color:#626262; font-size:20px; float:right; padding:2px; padding-top:4px"></i>`;
        } else if (task.state === "en attente"){
          return `${task.text} <i class="fa-solid fa-circle-pause" style="color:#626262; font-size:20px; float:right; padding:2px; padding-top:4px"></i>`;
        }
      }else if (task.$level === 1) {
        if (task.state === "TERMINE") {
          return `${task.title} <i class="fa-solid fa-check" style="color:green; font-size:15px; float:right; padding:2px; padding-top:4px"></i>`;
        } else if (task.state === "EN_COURS") {
          return `${task.title} <i class="fa-solid fa-spinner fa-beat-fade" style="color:#626262; font-size:15px; float:right; padding:2px; padding-top:4px"></i>`;
        } else if (task.state === "EN_ATTENTE"){
          return `${task.title} <i class="fa-solid fa-circle-pause" style="color:#626262; font-size:15px; float:right; padding:2px; padding-top:4px"></i>`;
        }
      }else if (task.$level === 2) {
        if (task.state === "terminé") {
          return `${task.title} <i class="fa-solid fa-check" style="color:green; font-size:15px; float:right; padding:2px; padding-top:4px"></i>`;
        } else if (task.state === "en cours") {
          return `${task.title} <i class="fa-solid fa-spinner fa-beat-fade" style="color:#626262; font-size:15px; float:right; padding:2px; padding-top:4px"></i>`;
        } else if (task.state === "à faire"){
          return `${task.title} <i class="fas fa-list-ul" style="color:#626262; font-size:15px; float:right; padding:2px; padding-top:4px"></i>`;
        } else {
          return `${task.title} <i class="fas fa-search" style="color:#626262; font-size:15px; float:right; padding:2px; padding-top:4px"></i>`;
        }
      }
    };



    gantt.init('gantt_here');
    gantt.parse({ data: [] });

    for (const sprint of this.sprints) {
      const start_date = new Date(sprint.dateLancement);
      const end_date = new Date(sprint.dateFin);
      const duration = gantt.calculateDuration(start_date, end_date);

      gantt.templates.rightside_text = function(start, end, task) {
        return task.custom_text || "";
      };
      const dateLancement = new Date(sprint.dateLancement);
      const dateFin = new Date(sprint.dateFin);
      const options = { day: 'numeric', month: 'long' };
      const dayLancement = dateLancement.getDate();
      const monthLancement = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateLancement).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateLancement).slice(1);
      const dayFin = dateFin.getDate();
      const monthFin = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateFin).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateFin).slice(1);
      const customText = `${dayLancement}${monthLancement} - ${dayFin}${monthFin}`;

      gantt.addTask({
        id: sprint.id,
        text: `Sprint ${this.sprints.indexOf(sprint) + 1}`,
        start_date: start_date,
        end_date: end_date,
        duration: duration,
        state: sprint.etat,
        velocity: `${sprint.velocite} points`,
        color:"#F1948A",
        readonly: true,
        custom_text: customText,
        etat:sprint.etat,
      });

      this.ticketService.getHistoireTicketBySprintId(sprint.id)
      .subscribe((tickets: TicketHistoire[]) => {
        console.log(tickets);
        tickets.forEach((ticket: TicketHistoire) => {
          let etat;
          if(ticket.status=='EN_COURS'){
            etat='en cours'
          }else if(ticket.status=='TERMINE'){
            etat='terminé'
          }
          else if(ticket.status=='EN_ATTENTE'){
            etat='en attente'
          }
          const ticket_start_date = new Date(ticket.dateDebut);
          const ticket_end_date = new Date(ticket.dateFin);
          const ticket_duration = gantt.calculateDuration(ticket_start_date, ticket_end_date);

          gantt.templates.rightside_text = function(start, end, task) {
            return task.custom_text || "";
          };

          const dateDebut = new Date(ticket.dateDebut);
          const dateFin = new Date(ticket.dateFin);
          const options = { day: 'numeric', month: 'long' };
          const dayLancement = dateDebut.getDate();
          const monthLancement = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateDebut).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateDebut).slice(1);
          const dayFin = dateFin.getDate();
          const monthFin = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateFin).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateFin).slice(1);
          const customText = `${dayLancement}${monthLancement} - ${dayFin}${monthFin}`;


          gantt.addTask({
            id: ticket.id,
            text: `Ticket histoire ${tickets.indexOf(ticket) + 1}`,
            start_date: ticket_start_date,
            end_date: ticket_end_date,
            duration: ticket_duration,
            parent: sprint.id,
            state: ticket.status,
            effort: ticket.effort,
            color:'#82E0AA',
            readonly: true,
            custom_text: `<div class="d-flex align-items-center">
            <span>${customText} tttt</span>&nbsp;&nbsp;
            <span class="badge badge-success rounded-circle mr-2" style="color:green; font-size:10px">
            ${ticket.effort} pts
            </span>
          </div>
          `,
            title: ticket.titre,
            etat:etat
          });

          // Add child tasks for each user story ticket
          this.ticketTacheService.getListTicketTacheParHt(ticket.id)
            .subscribe((taches: TacheTicket[]) => {
              console.log(taches);
              taches.forEach((tache: TacheTicket) => {
                const tache_start_date = new Date(tache.dateLancement);
                const tache_end_date = new Date(tache.dateFin);
                const tache_duration = gantt.calculateDuration(tache_start_date, tache_end_date);

                gantt.templates.rightside_text = function(start, end, task) {
                  return task.custom_text || "";
                };

                const dateDebut = new Date(tache.dateLancement);
                const dateFin = new Date(tache.dateFin);
                const options = { day: 'numeric', month: 'long' };
                const dayLancement = dateDebut.getDate();
                const monthLancement = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateDebut).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateDebut).slice(1);
                const dayFin = dateFin.getDate();
                const monthFin = new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateFin).charAt(0).toUpperCase() + new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(dateFin).slice(1);
                const customText = `${dayLancement}${monthLancement} - ${dayFin}${monthFin}`;

                gantt.addTask({
                  id: tache.id,
                  text: `Ticket tâche ${taches.indexOf(tache) + 1}`,
                  start_date: tache_start_date,
                  end_date: tache_end_date,
                  duration: tache_duration,
                  parent: ticket.id,
                  state: tache.etat,
                  color:'#F1C40F',
                  readonly: true,
                  title: '',
                  etat:tache.etat,
                  custom_text: `${tache.membreId ?
                    `<i class="fa-solid fa-bookmark"></i> ${tache.titre} | ${tache.nbHeurs} heure(s) | <i class="fas fa-user-circle"></i> ${tache.membre.nom} ${tache.membre.prenom}`
                    : `<i class="fa-solid fa-bookmark"></i> ${tache.titre} | ${tache.nbHeurs} heure(s) | <i class="fas fa-user-slash"></i> Aucun membre associé`}`
                });
              });
            });
        });
      });

    }
    gantt.render();
  }}
