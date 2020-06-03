import { gql } from '@apollo/client';

export const NODES = gql`
  query {
    Nodes @client
  }
`;

export const LINKS = gql`
  query {
    Links @client
  }
`;

export const LOG_MESSAGES = gql`
  query {
    logMessages @client
  }
`;

export const ACTIVE_ITEM = gql`
  query {
    activeItem @client {
      itemId
      itemType
    }
  }
`;

export const NODES_DATA = gql`
  query {
    Nodes @client {
      id
      label
      type
      story
      synchronous
      unreliable
    }
  }
`;

export const NODE_TAGS = gql`
  query {
    Nodes @client {
      id
      deleted
      edited
      created
    }
  }
`;

export const NODE_COLLAPSE_TAGS = gql`
  query {
    Nodes @client {
      id
      collapsed
      hidden
      hiddenBy
    }
  }
`;

export const LINK_NODES = gql`
  query { 
    Links @client {
      id
      x {
        id
      }
      y {
        id
      }
    }
  }
`;

export const EDITOR_NODE_DATA = gql`
  query {
    Nodes @client {
      id
      label
      type
      connectedTo {
        id
        type
      }
      Links {
        id
        type
      }
      collapsed
      hidden
      hiddenBy
      deleted
    }
  }
`;

export const NODES_WITH_TAGS = gql`
  query {
    Nodes @client {
      id
      label
      type
      story
      synchronous
      unreliable
      collapsed
      created
      hidden
      hiddenBy
      edited
      deleted
    }
  }
`;

export const LINKS_DATA = gql`
  query {
    Links @client {
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
    }
  }
`;

export const EDITOR_LINK_DATA = gql`
  query {
    Links @client {
      id
      label
      type
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
      deleted
    }
  }
`;

export const LINKS_WITH_TAGS = gql`
  query {
    Links @client {
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
      deleted
    }
  }
`;

export const EDITING_RIGHTS = gql`
  query {
    hasEditRights @client
  }
`;