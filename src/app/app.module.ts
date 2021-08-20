import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CommandService } from './jsonrpc_client/command.service';
import { ParserService } from './jsonrpc_client/parser.service';
import { MainPageComponent } from './main-page/main-page.component';
import { TerminalComponent } from './terminal/terminal.component';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { GraphContainerComponent } from './graph-container/graph-container.component';
import { Command } from 'protractor';

// This file is like the header of a C program
@NgModule({
  // declare the components of AppModule
  // all components would import the file in imports (I guess)
  declarations: [
    AppComponent,
    MainPageComponent,
    TerminalComponent,
    GraphContainerComponent
  ],
  // importing other modules
  imports: [
    // This is a neccessary module
    BrowserModule,
    // The routing Module for routing
    AppRoutingModule,
    NgxGraphModule,
  ],
  // The service in this array is used for the whole module
  // Only injects one instance
  providers: [ParserService, CommandService],
  // This define which component is the ''main''
  // matches the tag in index.html <-- entry point (?)
  bootstrap: [AppComponent]
})
export class AppModule { }
