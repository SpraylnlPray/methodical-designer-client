import React from 'react';
import App from './App';
import { ApolloClient, ApolloProvider, gql, HttpLink, InMemoryCache } from '@apollo/client';
import {
	addLogMessage, connectsNodes, deepCopy, generateLocalUUID, getDuplicates, handleConnectedNodes, setMultipleLinksProps,
} from './utils';
import { LINKS_WITH_TAGS, NODES_COLLAPSE, NODES_DATA, NODES_WITH_TAGS } from './queries/LocalQueries';
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
					return existingData || '';
				},
				to( existingData ) {
					return existingData || '';
				},
				smooth( existingData ) {
					return existingData || { enabled: false, type: '', roundness: '' };
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
					const { Nodes } = cache.readQuery( { query: NODES_DATA } );

					const linksCopy = deepCopy( variables.links );
					for ( let link of linksCopy ) {
						link.edited = false;
						link.created = false;
						link.deleted = false;
					}

					Nodes.forEach( node => {
						const multipleConnIDs = [];
						const connectedToIDs = node.connectedTo.map( connTo => connTo.id );
						// get all duplicate node IDs in connectedToIDs
						let duplicates = getDuplicates( connectedToIDs );
						// find the link for each of them and mark it as multiple
						duplicates.forEach( nodeID => {
							for ( let i = 0; i < linksCopy.length; i++ ) {
								if ( connectsNodes( node.id, nodeID, linksCopy[i] ) && !linksCopy[i].checked ) {
									linksCopy[i].checked = true;
									linksCopy[i].found = true;
									multipleConnIDs.push( linksCopy[i].id );
								}
							}
						} );
						setMultipleLinksProps( linksCopy, multipleConnIDs );
					} );
					//
					// // for any links that were not found as multiple connections, set their properties
					// linksCopy.map( link => {
					// 	if ( !link.found ) {
					// 		link.from = link.x.id;
					// 		link.to = link.y.id;
					// 	}
					// 	return link;
					// } );

					cache.writeQuery( {
						query: LINKS_WITH_TAGS,
						data: { Links: linksCopy },
					} );
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
					const { label, type, x_id, y_id, props, seq, x_end, y_end } = variables;
					const { optional, story } = props;
					const x = { id: x_id };
					const y = { id: y_id };
					const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );

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
					const newLinks = Links.concat( newLink );

					cache.writeQuery( {
						query: LINKS_WITH_TAGS,
						data: { Links: newLinks },
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
					// todo: use Links.find instead
					let linkToEdit = Links.filter( link => link.id === id )[0];
					linkToEdit = deepCopy( linkToEdit );

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
					let collapsable = nodesCopy.find( node => node.id === variables.id );
					// invert collapse property on node
					collapsable.collapsed = !collapsable.collapsed;

					let nodes = handleConnectedNodes( collapsable, collapsable, Links, nodesCopy );
					cache.writeQuery( {
						query: NODES_COLLAPSE,
						data: { Nodes: nodes.concat( collapsable ) },
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
