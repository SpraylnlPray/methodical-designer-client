import React from 'react';
import App from './App';
import { ApolloClient, ApolloProvider, gql, HttpLink, InMemoryCache } from '@apollo/client';
import { addLogMessage, deepCopy, generateLocalUUID, getDuplicates } from './utils';
import {
	snap, setLinkDisplayProps, setMultipleLinksProps, findAndHandleMultipleLinks, modifyConnectedLink, updateLink,
} from './Graph/LinkUtils';
import {
	setNodeImage, handleConnectedNodes, removeLinkFromLinks, removeNodeFromConnTo, addLinkToLinks, addNodeToConnTo,
} from './Graph/NodeUtils';
import { CALC_NODE_POSITION, EDITOR_NODE_DATA, LINKS_WITH_TAGS, NODES_COLLAPSE, NODES_DATA, NODES_WITH_TAGS } from './queries/LocalQueries';
import Favicon from 'react-favicon';
import rules from './Graph/Rules';
import { assertNonNullType } from 'graphql';

const icon_url = process.env.REACT_APP_ENV === 'prod' ? '../production-icon.png' : '../dev-icon.png';

const cache = new InMemoryCache( {
	dataIdFromObject: ( { id } ) => id,
	typePolicies: {
		Node: {
			fields: {
				created( existingData ) {
					return existingData || false;
				},
				edited( existingData ) {
					return existingData || false;
				},
				deleted( existingData ) {
					return existingData || false;
				},
				collapsed( existingData ) {
					return existingData || false;
				},
				hidden( existingData ) {
					return existingData || false;
				},
				hiddenBy( existingData ) {
					return existingData || false;
				},
				x( existingData ) {
					if ( existingData === undefined ) {
						return '';
					}
					return existingData;
				},
				y( existingData ) {
					if ( existingData === undefined ) {
						return '';
					}
					return existingData;
				},
				Links( existingData ) {
					return existingData || [];
				},
				connectedTo( existingData ) {
					return existingData || [];
				},
				image( existingData ) {
					return existingData || '';
				},
				shape( existingData ) {
					return existingData || '';
				},
			},
		},
		Link: {
			fields: {
				created( existingData ) {
					return existingData || false;
				},
				edited( existingData ) {
					return existingData || false;
				},
				deleted( existingData ) {
					return existingData || false;
				},
				from( existingData ) {
					return existingData || null;
				},
				to( existingData ) {
					return existingData || null;
				},
				smooth( existingData ) {
					return existingData || { enabled: false, type: '', roundness: '' };
				},
				color( existingData ) {
					return existingData || '#000000';
				},
				arrows( existingData ) {
					const defaultFrom = { enabled: false, type: '' };
					const defaultTo = { enabled: false, type: '', scaleFactor: 1 };
					if ( existingData ) {
						let ret = { ...existingData };
						if ( !ret.from ) {
							ret.from = defaultFrom;
						}
						if ( !ret.to ) {
							ret.to = defaultTo;
						}
						return ret;
					}
					return { from: defaultFrom, to: defaultTo };
				},
				name( existingData ) {
					return existingData || '';
				},
			},
		},
	},
} );

const uri = process.env.REACT_APP_ENV === 'prod' ? process.env.REACT_APP_PROD_HOST : process.env.REACT_APP_DEV_HOST;

const client = new ApolloClient( {
	link: new HttpLink( {
		uri,
	} ),
	cache,
	resolvers: {
		Mutation: {
			setNodes: ( _root, variables, { cache, client } ) => {
				try {
					const nodesCopy = deepCopy( variables.nodes );
					for ( let node of nodesCopy ) {
						node.edited = false;
						node.created = false;
						node.deleted = false;
						setNodeImage( node );
					}

					try {
						for ( let rule of rules ) {
							for ( let node of nodesCopy ) {
								rule( node, nodesCopy, client );
							}
						}
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying rules in setNodes: ' + e.message );
					}

					cache.writeQuery( {
						query: NODES_WITH_TAGS,
						data: { Nodes: nodesCopy },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in setNodes: ' + e.message );
				}
			},
			setLinks: ( _root, variables, { cache } ) => {
				try {
					const linksCopy = deepCopy( variables.links );
					for ( let link of linksCopy ) {
						const { x_end, y_end } = link;
						link.name = link.label;
						setLinkDisplayProps( link, x_end, y_end );
						link.edited = false;
						link.created = false;
						link.deleted = false;
					}

					for ( let link of linksCopy ) {
						findAndHandleMultipleLinks( link, linksCopy );
					}

					// for any links that were not found as multiple connections, set their properties
					linksCopy.map( link => {
						if ( !link.found ) {
							link.from = link.x.id;
							link.to = link.y.id;
						}
						return link;
					} );

					try {
						cache.writeQuery( {
							query: LINKS_WITH_TAGS,
							data: { Links: linksCopy },
						} );
					}
					catch ( e ) {
						addLogMessage( client, 'Error when writing links to cache: ' + e.message );
					}
				}
				catch ( e ) {
					addLogMessage( client, 'Error in setLinks: ' + e.message );
				}
			},

			addNode: ( _root, variables, { cache } ) => {
				try {
					const { label, props, type } = variables;
					const { Nodes } = cache.readQuery( { query: NODES_DATA } );

					const newId = generateLocalUUID();
					let newNode = {
						id: newId,
						label,
						type,
						connectedTo: [],
						Links: [],
						...props,
						created: true,
						edited: false,
						deleted: false,
						__typename: 'Node',
					};
					setNodeImage( newNode );

					try {
						for ( let rule of rules ) {
							rule( newNode, Nodes );
						}
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying rules in addNode: ' + e.message );
					}

					const newNodes = Nodes.concat( newNode );

					cache.writeQuery( {
						query: NODES_WITH_TAGS,
						data: { Nodes: newNodes },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in addNode: ' + e.message );
				}
			},
			addLink: ( _root, variables, { cache } ) => {
				try {
					const { Nodes } = cache.readQuery( { query: EDITOR_NODE_DATA } );
					let nodesCopy = deepCopy( Nodes );
					const { label, type, x_id, y_id, props, seq, x_end, y_end } = variables;
					const { optional, story } = props;
					const x = { id: x_id };
					const y = { id: y_id };
					const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );
					let linksCopy = deepCopy( Links );
					const newId = generateLocalUUID();
					const newLink = {
						id: newId,
						label,
						type,
						x,
						y,
						name: label,
						from: x.id,
						to: y.id,
						optional,
						story,
						x_end,
						y_end,
						sequence: seq,
						created: true,
						edited: false,
						__typename: 'Link',
					};
					setLinkDisplayProps( newLink, x_end, y_end );
					linksCopy = linksCopy.concat( newLink );
					// get the x and y node of the link
					const xNode = nodesCopy.find( node => node.id === newLink.x.id );
					const yNode = nodesCopy.find( node => node.id === newLink.y.id );
					// for the two nodes, save the new link in the Links list and the other node in their connectedTo list
					addLinkToLinks( xNode, newLink );
					addNodeToConnTo( xNode, yNode );
					addLinkToLinks( yNode, newLink );
					addNodeToConnTo( yNode, xNode );
					// get their connected links
					const connectedLinkIDs = [];
					xNode.Links.map( link => connectedLinkIDs.push( link.id ) );
					yNode.Links.map( link => connectedLinkIDs.push( link.id ) );
					// get link IDs that are in the array multiple times
					let multipleLinkIDs = getDuplicates( connectedLinkIDs );
					setMultipleLinksProps( linksCopy, multipleLinkIDs );
					cache.writeQuery( {
						query: EDITOR_NODE_DATA,
						data: { Nodes: nodesCopy },
					} );
					cache.writeQuery( {
						query: LINKS_WITH_TAGS,
						data: { Links: linksCopy },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in addLink: ' + e.message );
				}
			},

			updateNode: ( _root, variables, { cache } ) => {
				try {
					const { id, props } = variables;
					const { Nodes } = cache.readQuery( { query: NODES_WITH_TAGS } );
					const newNodes = Nodes.filter( node => node.id !== id );
					let nodeToEdit = Nodes.find( node => node.id === id );
					nodeToEdit = deepCopy( nodeToEdit );

					for ( let prop in props ) {
						if ( nodeToEdit[prop] !== props[prop] ) {
							if ( prop !== 'collapse' ) {
								nodeToEdit.edited = true;
							}
							nodeToEdit[prop] = props[prop];
						}
					}
					setNodeImage( nodeToEdit );
					cache.writeQuery( {
						query: NODES_WITH_TAGS,
						data: { Nodes: newNodes.concat( nodeToEdit ) },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in updateNode: ' + e.message );
				}
			},
			updateLink: ( _root, variables, { cache } ) => {
				try {
					const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );
					const { Nodes } = cache.readQuery( { query: NODES_DATA } );
					const nodesCopy = deepCopy( Nodes );
					const linksCopy = deepCopy( Links );
					// get old nodeIDs
					let linkToEdit = linksCopy.find( link => link.id === variables.id );
					const oldXNode = nodesCopy.find( aNode => aNode.id === linkToEdit.x.id );
					const oldYNode = nodesCopy.find( aNode => aNode.id === linkToEdit.y.id );
					// update link
					linkToEdit = updateLink( variables, linkToEdit );
					// get new nodeIDs
					const newXNode = nodesCopy.find( aNode => aNode.id === linkToEdit.x.id );
					const newYNode = nodesCopy.find( aNode => aNode.id === linkToEdit.y.id );

					// on the old nodes, remove the link from links and remove the respective other node form connectedTo
					removeLinkFromLinks( oldXNode, linkToEdit );
					removeNodeFromConnTo( oldXNode, oldYNode );
					removeLinkFromLinks( oldYNode, linkToEdit );
					removeNodeFromConnTo( oldYNode, oldXNode );
					// on the new nodes, add the link to links and add the respective other node to connectedTo
					addLinkToLinks( newXNode, linkToEdit );
					addNodeToConnTo( newXNode, newYNode );
					addLinkToLinks( newYNode, linkToEdit );
					addNodeToConnTo( newYNode, newXNode );

					const newLinks = linksCopy.filter( link => link.id !== linkToEdit.id );
					cache.writeQuery( {
						query: LINKS_WITH_TAGS,
						data: { Links: newLinks.concat( linkToEdit ) },
					} );
					cache.writeQuery( {
						query: NODES_DATA,
						data: { Nodes: nodesCopy },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in updateLink: ' + e.message );
				}
			},

			deleteNode: ( _root, variables, { cache } ) => {
				try {
					const { Nodes } = cache.readQuery( { query: NODES_DATA } );
					const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );

					let linksCopy = deepCopy( Links );
					const nodesCopy = deepCopy( Nodes );
					const connectedLinkIDs = [];
					for ( let node of nodesCopy ) {
						if ( node.id === variables.id ) {
							// mark the node as deleted
							node.deleted = true;
							// and save all connected link IDs
							for ( let link of node.Links ) {
								connectedLinkIDs.push( link.id );
							}
							break;
						}
					}

					for ( let link of linksCopy ) {
						// if the link id is in the list of connected links
						if ( connectedLinkIDs.includes( link.id ) ) {
							modifyConnectedLink( link, variables.id );
						}
					}

					cache.writeQuery( {
						query: NODES_DATA,
						data: { Nodes: nodesCopy },
					} );

					cache.writeQuery( {
						query: LINKS_WITH_TAGS,
						data: { Links: linksCopy },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in deleteNode: ' + e.message );
				}
			},
			deleteLink: ( _root, variables, { cache } ) => {
				try {
					const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );
					const { Nodes } = cache.readQuery( { query: NODES_DATA } );
					const newLinks = Links.filter( link => link.id !== variables.id );
					let linkToDelete = Links.find( link => link.id === variables.id );

					const x_id = linkToDelete.x.id;
					const y_id = linkToDelete.y.id;

					let xNode = deepCopy( Nodes.find( aNode => aNode.id === x_id ) );
					let yNode = deepCopy( Nodes.find( aNode => aNode.id === y_id ) );

					removeLinkFromLinks( xNode, linkToDelete );
					removeNodeFromConnTo( xNode, yNode );
					removeLinkFromLinks( yNode, linkToDelete );
					removeNodeFromConnTo( yNode, xNode );

					const newNodes = Nodes.filter( aNode => aNode.id !== x_id && aNode.id !== y_id );

					linkToDelete = deepCopy( linkToDelete );
					linkToDelete.deleted = true;
					cache.writeQuery( {
						query: LINKS_WITH_TAGS,
						data: { Links: newLinks.concat( linkToDelete ) },
					} );

					cache.writeQuery( {
						query: NODES_DATA,
						data: { Nodes: newNodes.concat( xNode, yNode ) },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in deleteLink: ' + e.message );
				}
			},

			collapseNode: ( _root, variables, { cache, client } ) => {
				try {
					const { Nodes } = cache.readQuery( { query: NODES_COLLAPSE } );
					const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );

					let nodesCopy = deepCopy( Nodes );
					let linksCopy = deepCopy( Links );
					let collapsable = nodesCopy.find( node => node.id === variables.id );
					// invert collapse property on node
					collapsable.collapsed = !collapsable.collapsed;
					nodesCopy = handleConnectedNodes( collapsable, collapsable, Links, nodesCopy );

					// update the links to snap to the right node
					for ( let link of linksCopy ) {
						snap( link, nodesCopy );
					}

					cache.writeQuery( {
						query: LINKS_WITH_TAGS,
						data: { Links: linksCopy },
					} );
					cache.writeQuery( {
						query: NODES_COLLAPSE,
						data: { Nodes: nodesCopy.concat( collapsable ) },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in collapseNode: ' + e.message );
				}
			},
			recalculateGraph: ( _root, variables, { cache } ) => {
				const { Nodes } = cache.readQuery( { query: CALC_NODE_POSITION } );
				let nodesCopy = deepCopy( Nodes );
				for ( let node of nodesCopy ) {
					node.x = undefined;
					node.y = undefined;
				}
				try {
					for ( let rule of rules ) {
						for ( let node of nodesCopy ) {
							rule( node, nodesCopy, client );
						}
					}
				}
				catch ( e ) {
					addLogMessage( client, 'Error when applying rules in recalculateGraph: ' + e.message );
				}
				cache.writeQuery( {
					query: CALC_NODE_POSITION,
					data: { Nodes: nodesCopy },
				} );
			},
		},
	},
} );

cache.writeQuery( {
	query: gql`
    query {
      logMessages
      hasEditRights
      activeItem {
        itemId
        itemType
      }
    }
	`,
	data: {
		logMessages: [],
		hasEditRights: false,
		activeItem: {
			itemId: 'app',
			itemType: 'app',
			__typename: 'ActiveItem',
		},
	},
} );

export default (
	<ApolloProvider client={ client }>
		<Favicon url={ icon_url }/>
		<App/>
	</ApolloProvider>
);
