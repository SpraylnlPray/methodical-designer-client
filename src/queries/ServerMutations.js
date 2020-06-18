import { gql } from '@apollo/client';

export const REQUEST_EDITING_RIGHTS = gql`
  mutation requestEditRights{
    RequestEditRights {
      message
      success
    }
  }
`;

export const FREE_EDITING_RIGHTS = gql`
  mutation freeEditRights {
    FreeEditRights {
      message
      success
    }
  }
`;

export const CREATE_NODE = gql`
  mutation($id: ID!, $label: String!, $nodeType: NodeType!, $props: NodeCreateInput){
    CreateNode(id: $id, label: $label, nodeType: $nodeType, props: $props) {
      success
      message
      node {
        id
        label
        nodeType
        story
        synchronous
        unreliable
      }
    }
  }
`;

export const CREATE_LINK = gql`
  mutation($id: ID!, $label: String!, $linkType: LinkType!, $x_id: ID!, $y_id: ID! $props: LinkCreateInput){
    CreateLink(id: $id, label: $label, linkType: $linkType, x_id: $x_id, y_id: $y_id, props: $props){
      success
      message
      link {
        id
        label
        linkType
        story
        optional
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
        nodeType
        story
        synchronous
        unreliable
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
        linkType
        story
        optional
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