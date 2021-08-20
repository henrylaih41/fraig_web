import { Injectable } from '@angular/core';
import { Terminal } from 'xterm';

@Injectable({
  providedIn: 'root'
})

class Trie {
  root : TrieNode;
  constructor(){this.root = new TrieNode()}

  insert(word: string){
    let node = this.root;
    for(let c of word){
      if(c in node.children){
        node = node.children[c];
        node.count += 1;
      }
      else{
        node.children[c] = new TrieNode();
        node = node.children[c]; 
      }
    }
    // node would be the last char in word;
    node.is_word = true;
    node.value = word;
  }

  findNode(prefix : string){
    let node = this.root;
    for(let c of prefix){
      if(c in node.children)
        node = node.children[c];
      else
        return null
    }
    return node;
  }

  findAllFromWord(word : string){
    let root = this.findNode(word);
    let result : string[] = [] 
    if(root === null)
      return result;
    this.dfs(root, result);
    return result;
  }
  
  dfs(root : TrieNode, arr: Array<string>){
    if(root.is_word)
      arr.push(root.value);
    for(let c in root.children)
      this.dfs(root.children[c], arr);
  }

  // the count of node must be 1
  retrieveCharactersFromNode(root : TrieNode){
    let arr : string[] = [];
    while(!root.is_word){
      // only one char in children
      for(let c in root.children)
        arr.push(c);
      root = root.children[arr[arr.length-1]];
    }

    return arr;
  }
}

class TrieNode {
  value : string;
  is_word : boolean;
  children : {[key:string] : TrieNode};
  count : number;
  constructor(count = 1, is_word = false){
    this.value = ""
    this.is_word = is_word;
    this.children = {};
    this.count = count;
  }
}

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
  constructor() { 
    for(let cmd of this.commands){
      this.trie.insert(cmd);
    }
  }
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

  // this function is strongly coupled with the logic in terminal components
  autoComplete(command_string: string, terminal : Terminal){
    let node = this.trie.findNode(command_string);
    console.log(command_string, node, this.trie.root);
    // no possible command
    if(node === null)
      return command_string;
    // only one possible command, auto complete it
    if(node.count == 1){
      let new_command = command_string;
      let arr = this.trie.retrieveCharactersFromNode(node);
      for(let c of arr){
        terminal.write(c);
        new_command += c;
      }
      return new_command;
    }
    // multiple possible command, do nothing
    return command_string;
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
