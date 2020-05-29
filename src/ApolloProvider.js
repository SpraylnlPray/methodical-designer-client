import React from 'react';
import App from './App';
import { ApolloClient, ApolloProvider, gql, HttpLink, InMemoryCache } from '@apollo/client';
import { deepCopy, generateLocalUUID } from './utils';
import { LINKS_WITH_TAGS, NODES_DATA, NODES_WITH_TAGS } from './queries/LocalQueries';
import Favicon from 'react-favicon';

const icon_url = process.env.REACT_APP_ENV === 'prod' ? '../production-icon.png' : '../dev-icon.png';

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
				deleted( existingData ) {
					return existingData || false;
				},
				collapse( existingData ) {
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
				deleted( existingData ) {
					return existingData || false;
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

			addNode: ( _root, variables, { cache } ) => {
				const { label, props, type } = variables;
				const { Nodes } = cache.readQuery( { query: NODES_DATA } );

				const newId = generateLocalUUID();
				const newNode = {
					id: newId,
					label,
					type,
					...props,
					created: true,
					edited: false,
					__typename: 'Node',
				};
				const newNodes = Nodes.concat( newNode );

				cache.writeQuery( {
					query: NODES_WITH_TAGS,
					data: { Nodes: newNodes },
				} );
			},
			addLink: ( _root, variables, { cache } ) => {
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
			},

			updateNode: ( _root, variables, { cache } ) => {
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
			},
			updateLink: ( _root, variables, { cache } ) => {
				let { id, props, seq: sequence, x_end, y_end } = variables;
				const { label, type, x_id, y_id, optional, story } = props;
				const x = { id: x_id };
				const y = { id: y_id };
				props = { label, type, optional, story, x, y, sequence, x_end, y_end };

				const { Links } = cache.readQuery( { query: LINKS_WITH_TAGS } );
				const newLinks = Links.filter( link => link.id !== id );
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
			},

			deleteNode: ( _root, variables, { cache } ) => {
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
			},
			deleteLink: ( _root, variables, { cache } ) => {
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
