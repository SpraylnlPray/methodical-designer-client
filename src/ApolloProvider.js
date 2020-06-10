import React from 'react';
import App from './App';
import { ApolloClient, ApolloProvider, gql, HttpLink, InMemoryCache } from '@apollo/client';
import {
	addLogMessage, areBothHidden, connectsNodes, deepCopy, generateLocalUUID, getDuplicates, handleConnectedNodes, isHidden,
	setLinkDisplayProps, setMultipleLinksProps, setNodeImage,
} from './utils';
import { EDITOR_NODE_DATA, LINKS_WITH_TAGS, NODES_COLLAPSE, NODES_DATA, NODES_WITH_TAGS } from './queries/LocalQueries';
import Favicon from 'react-favicon';
import { CollapsableRule, LooseChildRule, NoConnectionNodeRule, NonDomainRule, PartOfRule, SingleConnectionRule } from './Graph/Rules';

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
						for ( let node of nodesCopy ) {
							CollapsableRule( node, nodesCopy );
						}
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying collapse rule: ' + e.message );
					}

					try {
						for ( let node of nodesCopy ) {
							PartOfRule( node, nodesCopy );
						}
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying partof rule: ' + e.message );
					}

					try {
						LooseChildRule( nodesCopy );
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying loosechild rule: ' + e.message );
					}
					// for ( let node of nodesCopy ) {
					// 	SingleConnectionRule( node, nodesCopy );
					// }

					try {
						for ( let node of nodesCopy ) {
							NoConnectionNodeRule( node, nodesCopy );
						}
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying noconnection rule: ' + e.message );
					}

					try {
						NonDomainRule( nodesCopy );
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying nondomain rule: ' + e.message );
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
						setLinkDisplayProps( link, x_end, y_end );
						link.edited = false;
						link.created = false;
						link.deleted = false;
					}

					for ( let link of linksCopy ) {
						const multipleLinksIDs = [ link.id ];
						// get the x and y node id of the link
						const x_id = link.x.id;
						const y_id = link.y.id;
						// get all other links
						const otherLinks = linksCopy.filter( aLink => aLink.id !== link.id && !aLink.checked );
						// check if any of the other links connects the same nodes
						for ( let checkLink of otherLinks ) {
							// if it connects the same nodes
							if ( connectsNodes( x_id, y_id, checkLink ) ) {
								// save it to the list
								multipleLinksIDs.push( checkLink.id );
							}
						}
						setMultipleLinksProps( linksCopy, multipleLinksIDs );
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
						CollapsableRule( newNode, Nodes );
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying collapse rule: ' + e.message );
					}
					try {
						NoConnectionNodeRule( newNode, Nodes );
					}
					catch ( e ) {
						addLogMessage( client, 'Error when applying noconnection rule: ' + e.message );
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

					for ( let node of nodesCopy ) {
						// for the two nodes, save the new link in the Links list and the other node in their connectedTo list
						if ( node.id === newLink.x.id ) {
							node.Links.push( { __typename: 'Link', id: newLink.id, type: newLink.type } );
							node.connectedTo.push( { __typename: 'Node', id: yNode.id, type: yNode.type } );
						}
						else if ( node.id === newLink.y.id ) {
							node.Links.push( { __typename: 'Link', id: newLink.id, type: newLink.type } );
							node.connectedTo.push( { __typename: 'Node', id: xNode.id, type: xNode.type } );
						}
					}

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
					let nodeToEdit = Nodes.filter( node => node.id === id )[0];
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
					let { id, props, seq: sequence, x_end, y_end } = variables;
					const { label, type, x_id, y_id, optional, story } = props;
					const x = { id: x_id };
					const y = { id: y_id };
					props = { label, type, optional, story, x, y, sequence, x_end, y_end };

					const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );
					const newLinks = Links.filter( link => link.id !== id );
					let linkToEdit = Links.find( link => link.id === id );
					linkToEdit = deepCopy( linkToEdit );
					setLinkDisplayProps( linkToEdit, x_end, y_end );

					for ( let prop in props ) {
						linkToEdit[prop] = props[prop];
					}
					linkToEdit.edited = true;

					cache.writeQuery( {
						query: LINKS_WITH_TAGS,
						data: { Links: newLinks.concat( linkToEdit ) },
					} );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in updateLink: ' + e.message );
				}
			},

			deleteNode: ( _root, variables, { cache } ) => {
				try {
					const { Nodes } = cache.readQuery( { query: NODES_WITH_TAGS } );
					const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );

					let nodeToDelete = Nodes.find( node => node.id === variables.id );
					let newNodes = Nodes.filter( node => node.id !== variables.id );
					let linksCopy = deepCopy( Links );

					// handle links connected to the deleted node
					linksCopy = linksCopy.map( link => {
						let sameNodes = link.x.id === link.y.id;
						let isNodeToDelete = link.x.id === nodeToDelete.id;
						// if both link ends are connected to the same node and this node is the one to be deleted
						if ( sameNodes && isNodeToDelete ) {
							// AND the link exists in the DB mark the link as deleted
							if ( !link.created ) {
								link.deleted = true;
							}
							// otherwise remove it from the cache
							else {
								cache.evict( link.id );
							}
						}
						// otherwise, assign the link end whose node will be deleted the same node as the other link end
						else if ( link.x.id === nodeToDelete.id ) {
							link.x.id = link.y.id;
							link.edited = true;
						}
						else if ( link.y.id === nodeToDelete.id ) {
							link.y.id = link.x.id;
							link.edited = true;
						}
						return link;
					} );


					// if the node to delete exists in the DB, add it to the ones to be deleted
					if ( !nodeToDelete.created ) {
						nodeToDelete = deepCopy( nodeToDelete );
						nodeToDelete.deleted = true;
					}
					// otherwise remove it from the cache
					else {
						cache.evict( nodeToDelete.id );
					}

					cache.writeQuery( {
						query: NODES_WITH_TAGS,
						data: { Nodes: newNodes.concat( nodeToDelete ) },
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

					const newLinks = Links.filter( link => link.id !== variables.id );
					let linkToDelete = Links.filter( link => link.id === variables.id )[0];

					if ( !linkToDelete.created ) {
						linkToDelete = deepCopy( linkToDelete );
						linkToDelete.deleted = true;
						cache.writeQuery( {
							query: LINKS_WITH_TAGS,
							data: { Links: newLinks.concat( linkToDelete ) },
						} );
					}
					else {
						cache.evict( linkToDelete.id );
					}
				}
				catch ( e ) {
					addLogMessage( client, 'Error in deleteLink: ' + e.message );
				}
			},

			collapseNode: ( _root, variables, { cache } ) => {
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
						const x_node = nodesCopy.find( node => node.id === link.x.id );
						const y_node = nodesCopy.find( node => node.id === link.y.id );
						// snapping should only happen if one of them is still visible
						if ( x_node && y_node && !areBothHidden( x_node, y_node ) && link.type !== 'PartOf' ) {
							if ( x_node.changedVisibility ) {
								// if the node is hidden, set the links property to the hiddenBy value from the node
								if ( isHidden( x_node ) ) {
									link.from = x_node.hiddenBy;
								}
								else {
									link.from = link.x.id;
								}
							}
							if ( y_node.changedVisibility ) {
								if ( isHidden( y_node ) ) {
									link.to = y_node.hiddenBy;
								}
								else {
									link.to = link.y.id;
								}
							}
						}
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
