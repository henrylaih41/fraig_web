import { Injectable } from '@angular/core';
import { Terminal } from 'xterm';
import {Trie} from '../trie'
@Injectable({
  providedIn: 'root'
})

export class ParserService {
  trie = new Trie();
  commands = ["cirread", "cirwrite", "add"]
  usage : {[key:string] : string} = {
    "cirread": "Usage: CIRRead <(string fileName)> [-Replace]",
    "cirwrite" : "Usage: CIRWrite [(int gateId)][-Output (string aagFile)]",
  }
  // The option check for each command, every new commands need a
  // option check.
  optionCheck : {[key:string] : Function} = {
    "cirread" : (options: string[]) => {
      console.log("Check cirread %s", options);
    },
    "cirwrite" : (options: string[]) => {
      console.log("Check cirwrite %s", options);
    },
  }
  constructor() {}
  // TODO: allow lazy completion
  // TODO: allow space in front of command
  parseCommand(command_string : string, terminal : Terminal){
    let args : string[] = command_string.split(' ');
    let cmd : string = args[0].toLowerCase();
    let options : string[] = args.slice(1);
    let parsed_options : {[key:string] : string} = {}
    // Error Handling: illegal commands
    if(!this.commands.includes(cmd)){
      terminal.write('\r\n');
      terminal.write("Illegal Command (" + cmd + ")!!!");
      return null;
    }
    // [TODO] do option
    // hard code for testing 
    if(cmd == "cirread"){
      parsed_options["fileName"] = options[0];
    }
    return { 
      "cmd" : cmd,
      "options" : parsed_options,
    };
  }

  // optimization can be done here if the graph generation is too slow
  parseCircuit(file){
    // CONST 0 is always in the graph
    let graph = {nodes: [{id: "0", 
                 label: "0", 
                 data: {
                  is_aig : false,
                 }
                }], links: []};
    let lines = file.split("\n");
    console.log(lines)
    // hard code parsing
    // first lines contains "aag max_id input_num latch_num (0) output_num AIG_num 
    let header = lines[0].split(" ");
    console.log(header);
    let max_id     = parseInt(header[1]);
    let input_num  = parseInt(header[2]);
    let output_num = parseInt(header[4]);
    let AIG_num    = parseInt(header[5]);
    let i = 1;
    for(; i <= input_num; ++i){
      let idx = Math.floor(parseInt(lines[i]) / 2);
      graph.nodes.push({id: idx.toString(), 
                        label: idx.toString(),
                        data: {
                          is_aig: false,
                        },
                      });  
    }
    for(; i <= input_num + output_num; ++i){
      let idx = Math.floor(parseInt(lines[i]) / 2);
      let oidx = i - input_num + max_id;
      graph.nodes.push({id: oidx.toString(), 
                        label: oidx.toString(),
                        data : {
                          is_aig: false,
                        }
                      });  
      graph.links.push({source: idx.toString(), 
                        target: oidx.toString(),
                        data: {type : "output"},
                      })
    }

    for(; i <= input_num + output_num + AIG_num; ++i){
      let line = lines[i].split(" ");
      let idx = Math.floor(parseInt(line[0])/2)
      graph.nodes.push({id: idx.toString(), 
                        label: idx.toString(),
                        data : {
                          is_aig : true,
                        }
                      });  
      let left_idx = Math.floor(parseInt(line[1])/2);
      let right_idx = Math.floor(parseInt(line[2])/2);
      graph.links.push({source: left_idx.toString(), 
                        target: idx.toString(),
                        data : {
                          type : "left"
                        },
                      })
      graph.links.push({source: right_idx.toString(), 
                        target: idx.toString(),
                        data : {
                          type : "right"
                        },
                      })
    }

    return graph;
  }
}
