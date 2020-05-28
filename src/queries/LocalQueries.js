import { gql } from '@apollo/client';

export const NODES_DATA = gql`
  query {
    Nodes @client
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

export const LOCAL_NODES = gql`
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

export const EDITOR_NODE_DATA = gql`
  query {
    Nodes @client {
      id
      label
      type
      collapse
    }
  }
`;

export const LOCAL_NODES_TAGS = gql`
  query {
    Nodes @client {
      id
      label
      type
      story
      synchronous
      unreliable
      collapse
      created
      edited
    }
  }
`;

export const DELETED_NODES = gql`
  query {
    deletedNodes @client {
      id
    }
  }
`;

export const DELETED_LINKS = gql`
  query {
    deletedLinks @client {
      id
    }
  }
`;

export const LOCAL_LINKS = gql`
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
		}
	}
`;

export const LOCAL_LINKS_TAGS = gql`
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
    }
  }
`;

export const EDITING_RIGHTS = gql`
  query {
    hasEditRights @client
  }
`;