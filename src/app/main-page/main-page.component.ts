import { Component, OnInit } from '@angular/core';
import { CommandService } from '../jsonrpc_client/command.service';

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.css']
})
export class MainPageComponent implements OnInit{
  constructor(private commandService : CommandService) {
  };

  ngOnInit(): void {

  }
}
