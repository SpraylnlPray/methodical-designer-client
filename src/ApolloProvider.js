import React from 'react';
import App from './App';
import { ApolloClient, ApolloProvider, gql, HttpLink, InMemoryCache } from '@apollo/client';
import { deepCopy, generateLocalUUID } from './utils';
import {
	DELETED_LINKS, DELETED_NODES, LOCAL_LINKS, LOCAL_LINKS_TAGS, LOCAL_NODES, LOCAL_NODES_TAGS,
} from './queries/LocalQueries';

const cache = new InMemoryCache( {
	dataIdFromObject: ( { id } ) => id,
	typePolicies: {
		Query: {
			fields: {
				Nodes( existingData ) {
					return existingData;
				},
			},
		},
		Node: {
			fields: {
				created( existingData ) {
					return existingData || false;
				},
				edited( existingData ) {
					return existingData || false;
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
			},
		},
	},
} );

const client = new ApolloClient( {
	link: new HttpLink( {
		uri: 'http://ec2co-ecsel-1y0tuf5jfvvua-14597932.us-east-2.elb.amazonaws.com:8080/graphql',
	} ),
	cache,
	resolvers: {
		Mutation: {

			addNode: ( _root, variables, { cache } ) => {
				const { label, props, type } = variables;
				const { story, synchronous, unreliable } = props;
				const { Nodes } = cache.readQuery( { query: LOCAL_NODES } );

				const newId = generateLocalUUID();
				const newNode = { id: newId, label, type, story, synchronous, unreliable, created: true, edited: false };
				const newNodes = Nodes.concat( newNode );

				cache.writeQuery( {
					query: LOCAL_NODES_TAGS,
					data: { Nodes: newNodes },
				} );
			},
			addLink: ( _root, variables, { cache } ) => {
				const { label, type, x_id, y_id, props, seq, x_end, y_end } = variables;
				const { optional, story } = props;
				const x = { id: x_id };
				const y = { id: y_id };
				const { Links } = cache.readQuery( { query: LOCAL_LINKS_TAGS } );

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
				};
				const newLinks = Links.concat( newLink );

				cache.writeQuery( {
					query: LOCAL_LINKS_TAGS,
					data: { Links: newLinks },
				} );
			},

			updateNode: ( _root, variables, { cache } ) => {
				const { id, props } = variables;

				const { Nodes } = cache.readQuery( { query: LOCAL_NODES_TAGS } );
				const newNodes = Nodes.filter( node => node.id !== id );
				let nodeToEdit = Nodes.filter( node => node.id === id )[0];
				nodeToEdit = deepCopy( nodeToEdit );

				for ( let prop in props ) {
					nodeToEdit[prop] = props[prop];
				}
				nodeToEdit.edited = true;

				cache.writeQuery( {
					query: LOCAL_NODES_TAGS,
					data: { Nodes: newNodes.concat( nodeToEdit ) },
				} );
			},
			updateLink: ( _root, variables, { cache } ) => {
				let { id, props, seq: sequence, x_end, y_end } = variables;
				const { label, type, x_id, y_id, optional, story } = props;
				const x = { id: x_id };
				const y = { id: y_id };
				props = { label, type, optional, story, x, y, sequence, x_end, y_end };

				const { Links } = cache.readQuery( { query: LOCAL_LINKS_TAGS } );
				const newLinks = Links.filter( link => link.id !== id );
				let linkToEdit = Links.filter( link => link.id === id )[0];
				linkToEdit = deepCopy( linkToEdit );

				for ( let prop in props ) {
					linkToEdit[prop] = props[prop];
				}
				linkToEdit.edited = true;

				cache.writeQuery( {
					query: LOCAL_LINKS_TAGS,
					data: { Links: newLinks.concat( linkToEdit ) },
				} );
			},

			deleteNode: ( _root, variables, { cache } ) => {
				const { Nodes } = cache.readQuery( { query: LOCAL_NODES_TAGS } );
				const { deletedNodes } = cache.readQuery( { query: DELETED_NODES } );
				const { Links } = cache.readQuery( { query: LOCAL_LINKS_TAGS } );
				const { deletedLinks } = cache.readQuery( { query: DELETED_LINKS } );

				let nodeToDelete = Nodes.find( node => node.id === variables.id );
				let newNodes = Nodes.filter( node => node.id !== variables.id );
				let linksCopy = deepCopy( Links );
				let linksToDelete = [];

				linksCopy = linksCopy.map( link => {
					let sameNodes = link.x.id === link.y.id;
					let isToDeleteNode = link.x.id === nodeToDelete.id;
					// if both link ends are connected to the same node and this node is the one to be deleted
					if ( sameNodes && isToDeleteNode ) {
						// AND the link exists in the DB save the link to the ones that'll be deleted
						if ( !link.created ) {
							linksToDelete.push( link );
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

				// create a new array that doesn't contain any deleted link
				linksCopy = linksCopy.filter( link => {
					for ( let deletedLink of linksToDelete ) {
						if ( link.id === deletedLink.id ) {
							return false;
						}
					}
					return true;
				} );

				cache.writeQuery( {
					query: LOCAL_NODES_TAGS,
					data: { Nodes: newNodes },
				} );

				// if the node to delete exists in the DB, add it to the ones to be deleted
				let newDeletedNodes = deletedNodes;
				if ( !nodeToDelete.created ) {
					newDeletedNodes = deletedNodes.concat( nodeToDelete );
				}
				// otherwise remove it from the cache
				else {
					cache.evict( nodeToDelete.id );
				}

				cache.writeQuery( {
					query: DELETED_NODES,
					data: { deletedNodes: newDeletedNodes },
				} );

				cache.writeQuery( {
					query: LOCAL_LINKS_TAGS,
					data: { Links: linksCopy },
				} );

				cache.writeQuery( {
					query: DELETED_LINKS,
					data: {
						deletedLinks: deletedLinks.concat( linksToDelete ),
					},
				} );
			},
			deleteLink: ( _root, variables, { cache } ) => {
				const { Links } = cache.readQuery( { query: LOCAL_LINKS_TAGS } );
				const { deletedLinks } = cache.readQuery( { query: DELETED_LINKS } );

				const newLinks = Links.filter( link => link.id !== variables.id );
				const linkToDelete = Links.filter( link => link.id === variables.id )[0];

				cache.writeQuery( {
					query: LOCAL_LINKS,
					data: { Links: newLinks },
				} );

				let newDeletedLinks = deletedLinks;
				if ( !linkToDelete.created ) {
					newDeletedLinks = deletedLinks.concat( linkToDelete );
				}
				else {
					cache.evict( linkToDelete.id );
				}

				cache.writeQuery( {
					query: DELETED_LINKS,
					data: { deletedLinks: newDeletedLinks },
				} );
			},
		},
	},
} );

cache.writeQuery( {
	query: gql`
    query {
      deletedNodes
      deletedLinks
      activeItem {
        itemId
        itemType
      }
    }
	`,
	data: {
		deletedNodes: [],
		deletedLinks: [],
		activeItem: {
			itemId: '',
			itemType: '',
			__typename: 'ActiveItem',
		},
	},
} );

export default (
	<ApolloProvider client={ client }>
		<App/>
	</ApolloProvider>
);
