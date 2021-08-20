import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Terminal } from "xterm";
import { CommandService } from '../jsonrpc_client/command.service';
import { ParserService } from '../jsonrpc_client/parser.service';
import { Trie } from '../trie';
@Component({
  selector: 'app-terminal',
  templateUrl: './terminal.component.html',
  styleUrls: ['./terminal.component.css'],
  encapsulation: ViewEncapsulation.None
})

// Not sure how to create the xterm without accessing the DOM div object
// So we have to do encapsulation None or ShadowDom
export class TerminalComponent implements  AfterViewInit {
  prompt: string = "fraig> ";
  current_line: string = this.prompt;
  history: string[] = [];
  history_index: number = 0;
  terminal: any;
  last_key : string = "";
  trie = new Trie()
  constructor(private commandService: CommandService, 
              private parserService: ParserService, ) {
    for(let cmd of parserService.commands){
      this.trie.insert(cmd);
    }
  }
  // to open xterm, we have to retrieve dom object
  @ViewChild('xterm_div', {static: true}) xterm_div!: ElementRef; 
  
  // Here we just follow the instructions on xterm.js, we
  // pass the retrieved dom div object (via ViewChild), and pass
  // it to terminal.open(), note that ViewChild only retrieved the
  // element after is has be created (thus ngAfterViewInit()), so 
  // before Init, xterm_div is undefined
  ngAfterViewInit(){
    this.terminal = new Terminal({
      cursorBlink: true,
    });
    console.log(this.terminal);
    this.terminal.open(this.xterm_div.nativeElement);
    this.terminal.write(this.prompt);

    // the terminal input logic
    this.terminal.onKey((event: {key: string, domEvent: KeyboardEvent}) => { 
      let ev: KeyboardEvent = event.domEvent;
      // the character pressed
      let key: string = event.key;
      let x_pos = this.terminal.buffer.active.cursorX;
      const printable = !ev.altKey && !ev.ctrlKey && !ev.metaKey;
      if (ev.key === "Enter") {
        // call RPC with command here
        let command = this.current_line.slice(this.prompt.length);
        if(command.length > 0) {
          this.history.push(command);
          this.commandService.sendCmd(command, this.terminal);
        }
        this.history_index = this.history.length;
        this.terminal.write('\r\n');
        this.terminal.write(this.prompt)
        this.current_line = this.prompt;
      } else if (ev.key === "Backspace") {
        if (this.terminal.buffer.active.cursorX > this.prompt.length) {
          // delete the word from line buf
          this.current_line = this.current_line.slice(0, x_pos-1) + 
                              this.current_line.slice(x_pos);
          // rewrite the display
          this.terminal.write('\b');
          this.terminal.write(this.current_line.slice(x_pos-1));
          this.terminal.write(' '); // to erase the last one 
          // move the cursor back to position
          for(let i = 0; i <= this.current_line.length - x_pos + 1; ++i)
            this.terminal.write('\b');
        }
      } else if(ev.key == "Tab"){
          this.current_line = this.prompt + this.autoComplete(this.current_line.slice(this.prompt.length));   
      } else if (printable) {
          if(ev.key == "ArrowUp" || ev.key == "ArrowDown"){
            let dir = {"ArrowUp": -1, "ArrowDown": 1}
            let new_index = this.history_index + dir[ev.key]
            if(new_index <= this.history.length && new_index >= 0){
              // clear the origin command
              this.terminal.write('\r');
              for(let i = 0; i < this.current_line.length; ++i ){
                  this.terminal.write(' ');
              }
              
              // write the history command
              // if lastest then the history is ""
              this.terminal.write('\r');
              if(new_index != this.history.length){
                this.current_line = this.prompt + this.history[new_index];
              }
              else{
                this.current_line = this.prompt;
              }
              this.terminal.write(this.current_line);
              this.history_index = new_index;
            }
            // clear the line
            // history
          } else if(ev.key == "ArrowLeft" || ev.key == "ArrowRight"){
              // moving the cursor
              let dir = {"ArrowLeft" : -1, "ArrowRight" : 1};
              if((x_pos + dir[ev.key] >= this.prompt.length) && (x_pos + dir[ev.key] <= this.current_line.length)){
                this.terminal.write(key);
              }
              
          } else{ 
              // inserting words at xpos (could be the tail)
              this.current_line = this.current_line.slice(0, x_pos) + key + 
                                  this.current_line.slice(x_pos);
              this.terminal.write(this.current_line.slice(x_pos));
              console.log(this.terminal.buffer.active.cursorX, x_pos);
              // move the cursor back to position
              for(let i = 1; i < this.current_line.length - x_pos ; ++i)
                this.terminal.write('\b');
          }
      }
      else if(ev.ctrlKey){
        if(ev.key == "k"){
          // clear the terminal screen
          this.terminal.write('\x1bc');
          this.terminal.write(this.prompt)
          this.current_line = this.prompt
        } else if(ev.key == "a"){
          for(let i = x_pos; i > this.prompt.length; --i)
            this.terminal.write('\b');
        } else if(ev.key == "e"){
            this.terminal.write(this.current_line.slice(x_pos));
        }
      } 
      this.last_key = ev.key;
      console.log(this.current_line, ev, this.history);
    });
  }

  autoComplete(command_string: string){
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
        this.terminal.write(c);
        new_command += c;
      }
      return new_command;
    }
    // multiple possible command, do nothing
    return command_string;
  }
}
