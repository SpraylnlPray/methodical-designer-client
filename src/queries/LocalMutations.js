import { gql } from '@apollo/client';

export const CREATE_LOCAL_NODE = gql`
  mutation CreateLocalNode($label: String!, $nodeType: NodeType!, $props: NodeCreateInput){
    addNode(label: $label, nodeType: $nodeType, props: $props) @client
  }
`;

// todo: use a required variable here as well
export const CREATE_LOCAL_LINK = gql`
  mutation CreateLocalLink($label: String!, $linkType: LinkType!, $x_id: ID!, $y_id: ID! $props: LinkCreateInput, $x_end: LinkEndInput, $y_end: LinkEndInput, $seq: SequencePropertyInput){
    addLink(label: $label, linkType: $linkType, x_id: $x_id, y_id: $y_id, props: $props, x_end: $x_end, y_end: $y_end, seq: $seq) @client
  }
`;

export const UPDATE_LOCAL_NODE = gql`
  mutation UpdateLocalNode($id: ID!, $props: NodeInput) {
    updateNode(id: $id, props: $props) @client
  }
`;

export const UPDATE_LOCAL_LINK = gql`
  mutation UpdateLocalLink($id: ID!, $props: LinkInput, $x_end: LinkEndInput, $y_end: LinkEndInput, $seq: SequencePropertyInput) {
    updateLink(id: $id, props: $props, x_end: $x_end, y_end: $y_end, seq: $seq) @client
  }
`;

export const DELETE_LOCAL_NODE = gql`
  mutation DeleteLocalNode($id: ID!) {
    deleteNode(id: $id) @client
  }
`;

export const DELETE_LOCAL_LINK = gql`
  mutation DeleteLocalLink($id: ID!) {
    deleteLink(id: $id) @client
  }
`;

export const COLLAPSE_NODE = gql`
  mutation CollapseNode($id: ID!) {
    collapseNode(id: $id) @client
  }
`;

export const SET_NODES = gql`
  mutation SetNodes($nodes: [Node]!) {
    setNodes(nodes: $nodes) @client
  }
`;

export const SET_LINKS = gql`
  mutation SetLinks($links: [Link]!) {
    setLinks(links: $links) @client
  }
`;

export const RECALCULATE_GRAPH = gql`
  mutation RecalculateGraph {
    recalculateGraph @client
  }
`;

export const MOVE_NODE = gql`
  mutation MoveNode($id: ID!, $x: Float!, $y: Float!) {
    moveNode(id: $id, x: $x, y: $y) @client
  }
`;

export const SEARCH_NODE_BY_LABEL = gql`
  mutation SearchNodeByLabel($searchString: String!) {
    searchNodeByLabel(searchString: $searchString) @client
  }
`;

export const SET_NODE_LABEL_FILTER = gql`
  mutation SetNodeLabelFilter($string: String!) {
    setNodeLabelFilter(string: $string) @client
  }
`;

export const SET_LINK_LABEL_FILTER = gql`
  mutation SetLinkLabelFilter($string: String!) {
    setLinkLabelFilter(string: $string) @client
  }
`;

export const SEARCH_LINK_BY_LABEL = gql`
  mutation SearchLinkByLabel($searchString: String!) {
    searchLinkByLabel(searchString: $searchString) @client
  }
`;

export const SET_CAMERA_POS = gql`
  mutation SetCameraPos($x: Float!, $y: Float!, $type: String, $id: String) {
    setCameraPos(x: $x, y: $y, type: $type, itemId: $id) @client
  }
`;

export const SET_CAMERA_NODE_INDEX = gql`
  mutation SetCameraNodeIndex($index: Int!) {
    setCameraNodeIndex(index: $index) @client
  }
`;

export const ADD_EDITOR_ACTION = gql`
  mutation AddEditorAction($type: String!, $itemID: String!, $x: Float!, $y: String!) {
    addEditorAction(type: $type, itemID: $itemID, x: $x, y: $y) @client
  }
`;