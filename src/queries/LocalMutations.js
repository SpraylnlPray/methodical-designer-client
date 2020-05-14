import { gql } from '@apollo/client';

export const CREATE_LOCAL_NODE = gql`
  mutation CreateLocalNode($label: String!, $type: NodeType!, $props: NodeCreateInput){
    addNode(label: $label, type: $type, props: $props) @client
  }
`;

// todo: use a required variable here as well
export const CREATE_LOCAL_LINK = gql`
  mutation CreateLocalLink($label: String!, $type: LinkType!, $x_id: ID!, $y_id: ID! $props: LinkCreateInput, $x_end: LinkEndInput, $y_end: LinkEndInput, $seq: SequencePropertyInput){
    addLink(label: $label, type: $type, x_id: $x_id, y_id: $y_id, props: $props, x_end: $x_end, y_end: $y_end, seq: $seq) @client
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