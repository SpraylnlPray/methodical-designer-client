import { gql } from '@apollo/client';

export const GET_SERVER_NODES = gql`
  query nodes{
    Nodes{
      id
      label
      nodeType
      story
      synchronous
      unreliable
      Links {
        id
        linkType
      }
      connectedTo {
        id
        nodeType
      }
    }
  }
`;

export const GET_SERVER_LINKS = gql`
  query links {
    Links {
      id
      label
      linkType
      story
      optional
      x {
        id
      }
      y {
        id
      }
      x_end {
        arrow
        note
      }
      y_end {
        arrow
        note
      }
      sequence {
        group
        seq
      }
    }
  }
`;