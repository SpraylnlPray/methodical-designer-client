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
      nodeType
      story
      synchronous
      unreliable
      needsCalculation
      x
      y
      deleted
      connectedTo {
        id
        nodeType
      }
      Links {
        id
        linkType
      }
    }
  }
`;

export const EDITOR_NODE_DATA = gql`
  query {
    Nodes @client {
      id
      label
      nodeType
      connectedTo {
        id
        nodeType
      }
      Links {
        id
        linkType
      }
      image
      shape
      x
      y
      collapsed
      hidden
      hiddenBy
      deleted
      selected
      shapeProperties {
        useBorderWithImage
      }
    }
  }
`;

export const NODES_COLLAPSE = gql`
  query {
    Nodes @client {
      id
      nodeType
      listIndex
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
      nodeType
      story
      synchronous
      unreliable
      listIndex
      needsCalculation
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
      moved
    }
  }
`;

export const LINKS_DATA = gql`
  query {
    Links @client {
      id
      label
      name
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

export const EDITOR_LINK_DATA = gql`
  query {
    Links @client {
      id
      label
      hidden
      linkType
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
      color
      arrows
      deleted
    }
  }
`;

export const NODES_BASE_DATA = gql`
  query {
    Nodes @client {
      id
      label
      nodeType
      story
      synchronous
      unreliable
    }
  }
`;

export const LINKS_WITH_TAGS = gql`
  query {
    Links @client {
      id
      label
      name
      hidden
      needsCalculation
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
      from
      to
      smooth {
        enabled
        type
        roundness
      }
      color
      # this works because in type policies I implicitly return all needed data!
      arrows
      created
      edited
      deleted
    }
  }
`;

export const LINKS_CALCULATION = gql`
  query {
    Links @client {
      id
      needsCalculation
    }
  }
`;

export const CALC_NODE_POSITION = gql`
  query {
    Nodes @client {
      id
      nodeType
      needsCalculation
      moved
      deleted
      x
      y
      connectedTo {
        id
      }
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

export const EDITING_RIGHTS = gql`
  query {
    hasEditRights @client
  }
`;

export const MOVE_NODE_DATA = gql`
  query {
    Nodes @client {
      id
      x
      y
      moved
    }
  }
`;

export const NODE_IDS = gql`
  query {
    Nodes @client {
      id
    }
  }
`;

export const NODE_SEARCH_INDEX = gql`
  query {
    nodeSearchIndex @client
  }
`;

export const MAX_NODE_INDEX = gql`
  query {
    maxNodeIndex @client
  }
`;

export const CAMERA_POS = gql`
  query {
    setCameraPos @client {
      itemId
      type
      x
      y
    }
  }
`;

export const NODES_SEARCH_DATA = gql`
  query {
    Nodes @client {
      id
      label
      searchIndex
      x
      y
    }
  }
`;

export const LINKS_HIDE_DATA = gql`
  query {
    Links @client{
      id
      label
      hidden
    }
  }
`;

export const SEARCH_NODE_LABEL_FILTER = gql`
  query {
    searchNodeLabelFilter @client
  }
`;

export const SEARCH_LINK_LABEL_FILTER = gql`
  query {
    searchLinkLabelFilter @client
  }
`;

export const LAST_EDITOR_ACTIONS = gql`
  query {
    lastEditorActions @client
  }
`;

export const NODE_SELECTED = gql`
  query {
    Nodes @client {
      id
      selected
      shapeProperties {
        useBorderWithImage
      }
    }
  }
`;