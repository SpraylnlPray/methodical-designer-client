import { gql } from '@apollo/client';

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
      x
      y
      deleted
      connectedTo {
        id
        type
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
      image
      shape
      x
      y
      collapsed
      hidden
      hiddenBy
      deleted
    }
  }
`;

export const NODES_COLLAPSE = gql`
  query {
    Nodes @client {
      id
      type
      collapsed
      hidden
      hiddenBy
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
      x
      y
      collapsed
      created
      hidden
      hiddenBy
      edited
      deleted
      image
      shape
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
      from
      to
      smooth {
        enabled
        type
        roundness
      }
#      color
#      arrows {
#        from {
#          enabled
#          type
#        }
#        to {
#          enabled
#          type
#          scaleFactor
#        }
#      }
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
      from
      to
      smooth {
        enabled
        type
        roundness
      }
#      color
#      arrows {
#        from {
#          enabled
#          type
#        }
#        to {
#          enabled
#          scaleFactor
#          type
#        }
#      }
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