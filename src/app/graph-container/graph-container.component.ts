import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { Subject } from 'rxjs';
import * as shape from 'd3-shape';
import { CommandService } from '../jsonrpc_client/command.service';
import { DagreNodesOnlyLayout } from './graph-custom-layout'
import * as parameter from './graph-shape-parameter';
@Component({
  selector: 'app-graph-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './graph-container.component.html',
  styleUrls: ['./graph-container.component.css']
})
export class GraphContainerComponent implements OnInit, AfterViewInit {
// Great reference here: https://stackblitz.com/edit/angular-edligh?file=src%2Fmain.ts
// More discussion here: https://gitter.im/swimlane/ngx-graph?at=5ce276f3ad024978c6f92bbc
  graph; // the graph info is stored in commandService
  curve = shape.curveBasis
  layout = new DagreNodesOnlyLayout()
  update$: Subject<boolean> = new Subject();
  aig_upperbase    = parameter.aig_upperbase
  aig_lowerbase    = parameter.aig_lowerbase
  aig_width        = parameter.aig_width
  aig_fill_color   = parameter.aig_fill_color
  aig_stroke_color = parameter.aig_stroke_color
  aig_text_x       = parameter.aig_width / 2
  aig_text_y       = parameter.aig_lowerbase / 2
  io_width         = parameter.io_width
  io_height        = parameter.io_height
  io_fill_color    = parameter.io_fill_color
  io_stroke_color  = parameter.io_stroke_color
  io_text_x        = parameter.io_width / 2
  io_text_y        = parameter.io_height / 2
  // svg path.d
  aig_d = `M 0 0 v ${this.aig_lowerbase} L ${this.aig_width} ${(this.aig_upperbase + this.aig_lowerbase)/2} v -${this.aig_upperbase} L 0 0`
  constructor(private commandService: CommandService) {
    this.graph = this.commandService.graph // the graph is stored in commandService
    this.commandService.cirwriteCalled$.subscribe(() => {
      this.graph = this.commandService.graph // update graph 
      this.update$.next(true)
    });
  }
  ngOnInit(): void {

  }

  ngAfterViewInit(){
  }
}
