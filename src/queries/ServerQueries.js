import { gql } from '@apollo/client';

export const GET_SERVER_NODES = gql`
  query nodes{
    Nodes{
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
`;

export const GET_SERVER_LINKS = gql`
  query links {
    Links {
      id
      label
      type
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
      created
      edited
    }
  }
`;