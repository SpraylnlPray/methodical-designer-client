import { gql } from '@apollo/client';

export const CREATE_NODE = gql`
  mutation($id: ID!, $label: String!, $type: NodeType!, $props: NodeCreateInput){
    CreateNode(id: $id, label: $label, type: $type, props: $props) {
      success
      message
      node {
        id
        label
        type
        story
        synchronous
        unreliable
        created
        edited
      }
    }
  }
`;

export const CREATE_LINK = gql`
  mutation($id: ID!, $label: String!, $type: LinkType!, $x_id: ID!, $y_id: ID! $props: LinkCreateInput){
    CreateLink(id: $id, label: $label, type: $type, x_id: $x_id, y_id: $y_id, props: $props){
      success
      message
      link {
        id
        label
        type
        story
        optional
        created
        edited
      }
    }
  }
`;

export const UPDATE_NODE = gql`
  mutation($id: ID!, $props: NodeInput) {
    UpdateNode(id: $id, props: $props) {
      success
      message
      node {
        id
        label
        type
        story
        synchronous
        unreliable
        created
        edited
      }
    }
  }
`;

export const UPDATE_LINK = gql`
  mutation($id: ID!, $props: LinkInput) {
    UpdateLink(id: $id, props: $props) {
      success
      message
      link {
        id
        label
        type
        story
        optional
        created
        edited
      }
    }
  }
`;

export const DELETE_NODE = gql`
  mutation($id: ID!) {
    DeleteNode(id: $id) {
      success
      id
    }
  }
`;

export const DELETE_LINK = gql`
  mutation($id: ID!) {
    DeleteLink(id: $id) {
      success
      id
    }
  }
`;

export const MERGE_SEQUENCE = gql`
  mutation mergeSequence($link_id: ID!, $props: SequencePropertyInput) {
    MergeSequence(link_id: $link_id, props: $props) {
      message
      success
      seq {
        group
        seq
      }
    }
  }
`;

export const DELETE_SEQUENCE = gql`
  mutation deleteSequence($link_id: ID!) {
    DeleteSequence(link_id: $link_id) {
      success
    }
  }
`;

export const MERGE_LINK_END = gql`
  mutation mergeLinkEnd($link_id: ID!, $props: LinkEndInput) {
    MergeLinkEnd(link_id: $link_id, props: $props) {
      message
      success
      end {
        arrow
        note
      }
    }
  }
`;

export const DELETE_LINK_END = gql`
  mutation deleteLinkEnd($link_id: ID!, $xy: String!) {
    DeleteLinkEnd(link_id: $link_id, xy: $xy) {
      success
    }
  }
`;