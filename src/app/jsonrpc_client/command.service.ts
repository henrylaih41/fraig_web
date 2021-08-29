import { NULL_EXPR } from '@angular/compiler/src/output/output_ast';
import { Injectable } from '@angular/core';
import { JSONRPCClient } from "json-rpc-2.0";
import { Terminal } from 'xterm';
import { ParserService } from './parser.service';
import { Subject } from 'rxjs';
@Injectable({
  /* We register this service to the dependency injection system
     When you provide the service at the root level, Angular 
     creates a single, shared instance of the service and injects 
     into any class that asks for it. */
  providedIn: 'root' // if this is SomeModule then only applications
                     // that import SomeModule can use this service

})
export class CommandService {
  // since the response from the server is sent here, 
  // we need a place to store the response graph. 
  // TODOS: find a way to pass the response directly to the 
  // responsible component
  graph = {nodes: [], links: []};
  // we need to function.bind(this) to maintain the this pointer to
  // the class object
  cmdHandler : {[key:string] : any} = {
    "cirwrite" : this.getCircuitHandler.bind(this),
    "cirread" : this.readCircuit.bind(this),
  }
  cirwriteSource = new Subject<any>();
  // to allow subscription 
  cirwriteCalled$ = this.cirwriteSource.asObservable();
  client: JSONRPCClient;
  constructor(private parser: ParserService) { 
    this.client = new JSONRPCClient((jsonRPCRequest) =>
      fetch("http://127.0.0.1:9123", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(jsonRPCRequest),
      }).then((response) => {
        if (response.status === 200) {
          // Use client.receive when you received a JSON-RPC response.
          return response
            .json()
            .then((jsonRPCResponse) => this.client.receive(jsonRPCResponse));
        } else if (jsonRPCRequest.id !== undefined) {
          return Promise.reject(new Error(response.statusText));
        }
        return Promise.reject(new Error(response.statusText));
      })
    );
  }

  sendCmd(command: string, terminal: Terminal){
    const parsed = this.parser.parseCommand(command.trim(), terminal);
    if(parsed !== null){
      this.client.request(parsed.cmd, parsed.options)
      .then((result) => {
        this.cmdHandler[parsed.cmd](result);
      });
    }
  }

  getCircuitHandler(result : Object){
    console.log(result);
    let payload = result["payload"];
    this.graph = this.parser.parseCircuit(payload);
    this.cirwriteSource.next();
  }

  readCircuit(result : Object){
    console.log(result);
  }

  getNewGraph(){
  }

}
