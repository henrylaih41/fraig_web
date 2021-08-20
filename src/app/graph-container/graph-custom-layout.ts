
// code from https://github.com/swimlane/ngx-graph/blob/184ce5aea8accadd6b72756a8d470e9da1d2d652/src/docs/demos/components/ngx-graph-org-tree/customDagreNodesOnly.ts
import { transformAll } from '@angular/compiler/src/render3/r3_ast';
import { parseI18nMeta } from '@angular/compiler/src/render3/view/i18n/meta';
import { Graph, Layout, Edge } from '@swimlane/ngx-graph';
import { O_APPEND } from 'constants';
import * as dagre from 'dagre';
import { AppRoutingModule } from '../app-routing.module';
import * as parameter from './graph-shape-parameter'

export enum Orientation {
  LEFT_TO_RIGHT = 'LR',
  RIGHT_TO_LEFT = 'RL',
  TOP_TO_BOTTOM = 'TB',
  BOTTOM_TO_TOM = 'BT'
}
export enum Alignment {
  CENTER = 'C',
  UP_LEFT = 'UL',
  UP_RIGHT = 'UR',
  DOWN_LEFT = 'DL',
  DOWN_RIGHT = 'DR'
}

export interface DagreSettings {
  orientation?: Orientation;
  marginX?: number;
  marginY?: number;
  edgePadding?: number;
  rankPadding?: number;
  nodePadding?: number;
  align?: Alignment;
  acyclicer?: 'greedy' | undefined;
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
  multigraph?: boolean;
  compound?: boolean;
}

export interface DagreNodesOnlySettings extends DagreSettings {
  curveDistance?: number;
}

const DEFAULT_EDGE_NAME = '\x00';
const GRAPH_NODE = '\x00';
const EDGE_KEY_DELIM = '\x01';

export class DagreNodesOnlyLayout implements Layout {
  defaultSettings: DagreNodesOnlySettings = {
    orientation: Orientation.LEFT_TO_RIGHT,
    marginX: parameter.marginX,
    marginY: parameter.marginY,
    edgePadding: parameter.edgePadding,
    rankPadding: parameter.rankPadding,
    nodePadding: parameter.nodePadding,
    curveDistance: parameter.curveDistance,
    multigraph: parameter.multigraph,
    compound: parameter.compound
  };
  settings: DagreNodesOnlySettings = {};

  dagreGraph: any;
  dagreNodes: any;
  dagreEdges: any;

  public run(graph: Graph): Graph {
    this.createDagreGraph(graph);
    dagre.layout(this.dagreGraph);

    graph.edgeLabels = this.dagreGraph._edgeLabels;

    for (const dagreNodeId in this.dagreGraph._nodes) {
      const dagreNode = this.dagreGraph._nodes[dagreNodeId];
      const node = graph.nodes.find(n => n.id === dagreNode.id);
      node.position = {
        x: dagreNode.x,
        y: dagreNode.y
      };
      node.dimension = {
        width: dagreNode.width,
        height: dagreNode.height
      };
    }
    for (const edge of graph.edges) {
      this.updateEdge(graph, edge);
    }

    return graph;
  }

  public updateEdge(graph: Graph, edge: Edge): Graph {
    const sourceNode = graph.nodes.find(n => n.id === edge.source);
    const targetNode = graph.nodes.find(n => n.id === edge.target);
    const rankAxis: 'x' | 'y' = this.settings.orientation === 'BT' || this.settings.orientation === 'TB' ? 'y' : 'x';
    const orderAxis: 'x' | 'y' = rankAxis === 'y' ? 'x' : 'y';
    const rankDimension = rankAxis === 'y' ? 'height' : 'width';
    const orderDimension = rankAxis === 'y' ? 'width' : 'height';
    const ends = {"left" : targetNode.position[orderAxis] - targetNode.dimension[orderDimension] / 2 + targetNode.dimension[orderDimension] / 3,
                  "right" : targetNode.position[orderAxis] - targetNode.dimension[orderDimension] / 2 + targetNode.dimension[orderDimension] * 2 / 3,
                  "output" : targetNode.position[orderAxis]}
    // node.position holds the middle point of the svg
    const startingPoint = {
      [orderAxis]: sourceNode.position[orderAxis],
      [rankAxis]: sourceNode.position[rankAxis] + (sourceNode.dimension[rankDimension] / 2)
    };
    const endingPoint = {
      [orderAxis]: ends[edge.data.type],
      [rankAxis]: targetNode.position[rankAxis] - targetNode.dimension[rankDimension] / 2
    };

    const curveDistance = this.settings.curveDistance || this.defaultSettings.curveDistance;
    // generate new points
    edge.points = [
      startingPoint,
      // {[rankAxis] : 0,
      //   [orderAxis] : 0,
      // },
      // {
      //   [rankAxis]: (startingPoint[rankAxis] + endingPoint[rankAxis]) / 2,
      //   [orderAxis]: startingPoint[orderAxis]
      // },
      // {
      //   [orderAxis]: endingPoint[orderAxis],
      //   [rankAxis]: (startingPoint[rankAxis] + endingPoint[rankAxis]) / 2,
      // },
      endingPoint
    ];
    const edgeLabelId = `${edge.source}${EDGE_KEY_DELIM}${edge.target}${EDGE_KEY_DELIM}${DEFAULT_EDGE_NAME}`;
    const matchingEdgeLabel = graph.edgeLabels[edgeLabelId];
    if (matchingEdgeLabel) {
      matchingEdgeLabel.points = edge.points;
    }
    return graph;
  }

  public createDagreGraph(graph: Graph): any {
    const settings = Object.assign({}, this.defaultSettings, this.settings);
    this.dagreGraph = new dagre.graphlib.Graph({ compound: settings.compound, multigraph: settings.multigraph });
    this.dagreGraph.setGraph({
      rankdir: settings.orientation,
      marginx: settings.marginX,
      marginy: settings.marginY,
      edgesep: settings.edgePadding,
      ranksep: settings.rankPadding,
      nodesep: settings.nodePadding,
      align: settings.align,
      acyclicer: settings.acyclicer,
      ranker: settings.ranker,
      multigraph: settings.multigraph,
      compound: settings.compound
    });

    // Default to assigning a new object as a label for each new edge.
    this.dagreGraph.setDefaultEdgeLabel(() => {
      return {
        /* empty */
      };
    });

    this.dagreNodes = graph.nodes.map(n => {
      const node: any = Object.assign({}, n);
      node.width = n.dimension.width;
      node.height = n.dimension.height;
      node.x = n.position.x;
      node.y = n.position.y;
      return node;
    });

    this.dagreEdges = graph.edges.map(l => {
	  let linkId: number = 1;
      const newLink: any = Object.assign({}, l);
      if (!newLink.id) {
        newLink.id = linkId;
		    linkId++;
      }
      return newLink;
    });

    for (const node of this.dagreNodes) {
        node.width = (node.data.is_aig) ? parameter.aig_width : parameter.io_width;
        node.height = (node.data.is_aig) ? parameter.aig_lowerbase : parameter.io_height;

      // update dagre
      this.dagreGraph.setNode(node.id, node);
    }

    // update dagre
    for (const edge of this.dagreEdges) {
      if (settings.multigraph) {
        this.dagreGraph.setEdge(edge.source, edge.target, edge, edge.id);
      } else {
        this.dagreGraph.setEdge(edge.source, edge.target);
      }
    }

    return this.dagreGraph;
  }
}