import React from 'react';
import App from './App';
import { ApolloClient, ApolloProvider, gql, HttpLink, InMemoryCache } from '@apollo/client';
import {
	addLogMessage, deepCopy, getDuplicates, getMatchingIDs, readFromCache, readLinksFromCache, readNodesFromCache, setCameraPos,
	writeLinksToCache,
	writeNodesToCache, writeToCache,
} from './utils';
import {
	snap, setLinkDisplayProps, setMultipleLinksProps, findAndHandleMultipleLinks, modifyConnectedLink, updateLink, assembleNewLink,
} from './Graph/LinkUtils';
import {
	setNodeImage, handleConnectedNodes, removeLinkFromLinks, removeNodeFromConnTo, addLinkToLinks, addNodeToConnTo,
	assembleNewNode, updateNode, placeNodes, setMaxNodeIndex, setNodeSearchIndex,
} from './Graph/NodeUtils';
import {
	CALC_NODE_POSITION, EDITOR_NODE_DATA, LINKS_WITH_TAGS, NODES_COLLAPSE, NODES_DATA, NODES_WITH_TAGS,
	MOVE_NODE_DATA, NODES_SEARCH_DATA, SEARCH_NODE_LABEL_FILTER, SEARCH_LINK_LABEL_FILTER, LINKS_HIDE_DATA, LINKS_CALCULATION,
	CAMERA_POS, NODE_SEARCH_INDEX, LAST_EDITOR_ACTIONS,
} from './queries/LocalQueries';
import Fuse from 'fuse.js';
import Favicon from 'react-favicon';

const icon_url = process.env.REACT_APP_ENV === 'prod' ? '../production-icon.png' : '../dev-icon.png';
const options = { keys: [ 'label' ], findAllMatches: true, includeScore: true };

const cache = new InMemoryCache( {
	dataIdFromObject: ( { id } ) => id,
	typePolicies: {
		Query: {
			fields: {
				lastEditorActions( existingData ) {
					return existingData || [];
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
				moved( existingData ) {
					return existingData || false;
				},
				needsCalculation( existingData ) {
					return existingData || false;
				},
				searchIndex( existingData ) {
					if ( existingData === undefined ) {
						return '';
					}
					return existingData;
				},
				listIndex( existingData ) {
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
				hidden( existingData ) {
					return existingData || false;
				},
				needsCalculation( existingData ) {
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
			setNodes: ( _root, variables, { cache, client } ) => {
				try {
					const nodesCopy = deepCopy( variables.nodes );
					for ( let node of nodesCopy ) {
						node.edited = false;
						node.created = false;
						node.deleted = false;
						node.needsCalculation = false;
						node.listIndex = nodesCopy.indexOf( node );
						setNodeImage( node );
					}

					try {
						placeNodes( nodesCopy, client );
					}
					catch ( e ) {
						addLogMessage( client, 'Error when allocating nodes: ' + e.message );
					}

					writeNodesToCache( client, cache, NODES_WITH_TAGS, { Nodes: nodesCopy }, 'setNodes' );
					setTimeout( () => {
						let camCoords = { __typename: 'SetCameraPos', type: 'fit', x: 0, y: 0 };
						writeToCache( client, cache, CAMERA_POS, { setCameraPos: camCoords }, 'Error when setting camera pos in setNodes' );
					}, 500 );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in setNodes: ' + e.message );
				}
			},
			setLinks: ( _root, variables, { cache, client } ) => {
				try {
					const linksCopy = deepCopy( variables.links );
					for ( let link of linksCopy ) {
						const { x_end, y_end } = link;
						link.name = link.label;
						setLinkDisplayProps( link, x_end, y_end );
						link.edited = false;
						link.created = false;
						link.deleted = false;
						link.hidden = false;
						link.needsCalculation = false;
					}

					for ( let link of linksCopy ) {
						findAndHandleMultipleLinks( link, linksCopy );
					}

					writeLinksToCache( client, cache, LINKS_WITH_TAGS, { Links: linksCopy }, 'setLinks' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in setLinks: ' + e.message );
				}
			},

			addNode: ( _root, variables, { client, cache } ) => {
				try {
					const { Nodes } = readNodesFromCache( client, cache, NODES_DATA, 'addNode' );
					const newNode = assembleNewNode( variables );
					setNodeImage( newNode );

					// get the last editor action with a 'click' type and its coordinates
					let { lastEditorActions } = readFromCache( client, cache, LAST_EDITOR_ACTIONS, 'Error when reading editor actions from cache in addNode' );
					for ( let action of lastEditorActions ) {
						if ( action.type === 'click' || action.type === 'drag' || action.type === 'zoom' ) {
							newNode.x = action.position.x;
							newNode.y = action.position.y;
							break;
						}
					}
					newNode.listIndex = Nodes.length;

					const newNodes = Nodes.concat( newNode );
					writeNodesToCache( client, cache, NODES_WITH_TAGS, { Nodes: newNodes }, 'addNode' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in addNode: ' + e.message );
				}
			},
			addLink: ( _root, variables, { client, cache } ) => {
				try {
					const { Nodes } = readNodesFromCache( client, cache, EDITOR_NODE_DATA, 'addLink' );
					const { Links } = readLinksFromCache( client, cache, LINKS_WITH_TAGS, 'addLink' );
					let nodesCopy = deepCopy( Nodes );
					let linksCopy = deepCopy( Links );
					const newLink = assembleNewLink( variables );
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
					writeNodesToCache( client, cache, EDITOR_NODE_DATA, { Nodes: nodesCopy }, 'addLink' );
					writeLinksToCache( client, cache, LINKS_WITH_TAGS, { Links: linksCopy }, 'addLink' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in addLink: ' + e.message );
				}
			},

			updateNode: ( _root, variables, { client, cache } ) => {
				try {
					const { Nodes } = readNodesFromCache( client, cache, NODES_WITH_TAGS, 'updateNode' );
					const newNodes = Nodes.filter( node => node.id !== variables.id );

					let nodeToEdit = Nodes.find( node => node.id === variables.id );
					const prevType = nodeToEdit.nodeType;
					nodeToEdit = updateNode( nodeToEdit, variables );
					const afterType = nodeToEdit.nodeType;
					if ( prevType !== afterType ) {
						nodeToEdit.needsCalculation = true;
					}

					const ret = newNodes.concat( nodeToEdit );
					ret.sort( ( node1, node2 ) => node1.listIndex > node2.listIndex ? 1 : node1.listIndex < node2.listIndex ? -1 : 0 );
					writeNodesToCache( client, cache, NODES_WITH_TAGS, { Nodes: ret }, 'updateNode' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in updateNode: ' + e.message );
				}
			},
			updateLink: ( _root, variables, { client, cache } ) => {
				try {
					const { Links } = readLinksFromCache( client, cache, LINKS_WITH_TAGS, 'updateLink' );
					const { Nodes } = readNodesFromCache( client, cache, NODES_DATA, 'updateLink' );
					const nodesCopy = deepCopy( Nodes );
					let linkToEdit = Links.find( link => link.id === variables.id );
					// remove the link temporarily
					let newLinks = Links.filter( link => link.id !== linkToEdit.id );
					// get old nodeIDs
					const oldXNode = nodesCopy.find( aNode => aNode.id === linkToEdit.x.id );
					const oldYNode = nodesCopy.find( aNode => aNode.id === linkToEdit.y.id );
					const oldType = linkToEdit.linkType;
					// update link
					linkToEdit = updateLink( variables, linkToEdit );
					// get new nodeIDs
					const newXNode = nodesCopy.find( aNode => aNode.id === linkToEdit.x.id );
					const newYNode = nodesCopy.find( aNode => aNode.id === linkToEdit.y.id );
					const newType = linkToEdit.linkType;

					if ( oldXNode.id !== newXNode.id || oldYNode.id !== newYNode.id || newType !== oldType ) {
						linkToEdit.needsCalculation = true;
						// on the old nodes, remove the link from links and remove the respective other node form connectedTo
						removeLinkFromLinks( oldXNode, linkToEdit );
						removeNodeFromConnTo( oldXNode, oldYNode );
						// on the new nodes, add the link to links and add the respective other node to connectedTo
						addLinkToLinks( newXNode, linkToEdit );
						addNodeToConnTo( newXNode, newYNode );
						// and vice versa for the other node
						removeLinkFromLinks( oldYNode, linkToEdit );
						removeNodeFromConnTo( oldYNode, oldXNode );
						addLinkToLinks( newYNode, linkToEdit );
						addNodeToConnTo( newYNode, newXNode );
					}

					newLinks = newLinks.concat( linkToEdit );
					writeLinksToCache( client, cache, LINKS_WITH_TAGS, { Links: newLinks }, 'updateLink' );
					writeNodesToCache( client, cache, NODES_DATA, { Nodes: nodesCopy }, 'updateLink' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in updateLink: ' + e.message );
				}
			},

			deleteNode: ( _root, variables, { cache } ) => {
				try {
					const { Nodes } = readNodesFromCache( client, cache, NODES_DATA, 'deleteNode' );
					const { Links } = readLinksFromCache( client, cache, LINKS_WITH_TAGS, 'deleteNode' );

					let linksCopy = deepCopy( Links );
					const nodesCopy = deepCopy( Nodes );
					const connectedLinkIDs = [];
					for ( let node of nodesCopy ) {
						if ( node.id === variables.id ) {
							// mark the node as deleted
							node.deleted = true;
							node.needsCalculation = true;
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

					writeNodesToCache( client, cache, NODES_DATA, { Nodes: nodesCopy }, 'updateLink' );
					writeLinksToCache( client, cache, LINKS_WITH_TAGS, { Links: linksCopy }, 'updateLink' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in deleteNode: ' + e.message );
				}
			},
			deleteLink: ( _root, variables, { cache } ) => {
				try {
					const { Links } = readLinksFromCache( client, cache, LINKS_WITH_TAGS, 'deleteLink' );
					const { Nodes } = readNodesFromCache( client, cache, NODES_DATA, 'deleteLink' );
					const newLinks = Links.filter( link => link.id !== variables.id );
					const linksCopy = deepCopy( newLinks );
					let linkToDelete = Links.find( link => link.id === variables.id );

					let xNode = deepCopy( Nodes.find( aNode => aNode.id === linkToDelete.x.id ) );
					let yNode = deepCopy( Nodes.find( aNode => aNode.id === linkToDelete.y.id ) );

					removeLinkFromLinks( xNode, linkToDelete );
					removeNodeFromConnTo( xNode, yNode );
					removeLinkFromLinks( yNode, linkToDelete );
					removeNodeFromConnTo( yNode, xNode );

					linkToDelete = deepCopy( linkToDelete );
					linkToDelete.deleted = true;

					const ret = linksCopy.concat( linkToDelete );
					for ( let link of ret ) {
						findAndHandleMultipleLinks( link, ret );
					}

					const newNodes = Nodes.filter( aNode => aNode.id !== xNode.id && aNode.id !== yNode.id );

					writeLinksToCache( client, cache, LINKS_WITH_TAGS, { Links: ret }, 'deleteLink' );
					writeNodesToCache( client, cache, NODES_DATA, { Nodes: newNodes.concat( xNode, yNode ) }, 'deleteLink' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in deleteLink: ' + e.message );
				}
			},

			collapseNode: ( _root, variables, { cache, client } ) => {
				try {
					const { Nodes } = readNodesFromCache( client, cache, NODES_COLLAPSE, 'collapseNode' );
					const { Links } = readLinksFromCache( client, cache, LINKS_WITH_TAGS, 'collapseNode' );

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

					for ( let link of linksCopy ) {
						findAndHandleMultipleLinks( link, linksCopy );
					}

					// any links that were not found (= marked as multiple links) disable the smoothness
					for ( let link of linksCopy ) {
						if ( !link.found ) {
							link.smooth = {
								enabled: false,
								type: 'horizontal',
								roundness: 0,
							};
						}
					}
					writeLinksToCache( client, cache, LINKS_WITH_TAGS, { Links: linksCopy }, 'deleteLink' );
					const ret = nodesCopy.concat( collapsable );
					ret.sort( ( node1, node2 ) => node1.listIndex > node2.listIndex ? 1 : node1.listIndex < node2.listIndex ? -1 : 0 );
					writeNodesToCache( client, cache, NODES_COLLAPSE, { Nodes: ret }, 'deleteLink' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in collapseNode: ' + e.message );
				}
			},
			recalculateGraph: ( _root, variables, { cache } ) => {
				const { Nodes } = readNodesFromCache( client, cache, CALC_NODE_POSITION, 'recalculateGraph' );
				const { Links } = readLinksFromCache( client, cache, LINKS_CALCULATION, 'recalculateGraph' );
				const nodesCopy = deepCopy( Nodes );
				const linksCopy = deepCopy( Links );
				for ( let node of nodesCopy ) {
					node.x = undefined;
					node.y = undefined;
					node.moved = false;
					node.needsCalculation = false;
				}

				try {
					placeNodes( nodesCopy, client );
				}
				catch ( e ) {
					addLogMessage( client, 'Error when allocating nodes: ' + e.message );
				}

				for ( let link of linksCopy ) {
					link.needsCalculation = false;
				}

				writeNodesToCache( client, cache, CALC_NODE_POSITION, { Nodes: nodesCopy }, 'recalculateGraph' );
				writeLinksToCache( client, cache, LINKS_CALCULATION, { Links: linksCopy }, 'recalculateGraph' );
			},
			moveNode: ( _root, variables, { cache, client } ) => {
				try {
					const { id, x, y } = variables;
					const { Nodes } = readNodesFromCache( client, cache, MOVE_NODE_DATA, 'moveNode' );
					const nodesCopy = deepCopy( Nodes );
					const movedNode = nodesCopy.find( aNode => aNode.id === id );
					movedNode.x = x;
					movedNode.y = y;
					movedNode.moved = true;
					writeNodesToCache( client, cache, MOVE_NODE_DATA, { Nodes: nodesCopy }, 'moveNode' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error when moving node: ' + e.message );
				}
			},

			setNodeLabelFilter: ( _root, variables, { cache, client } ) => {
				try {
					const { string } = variables;
					writeToCache( client, cache, SEARCH_NODE_LABEL_FILTER, { searchNodeLabelFilter: string }, 'Error when writing nodeLabelFilter to cache in setNodeLabelFilter' );
					return string;
				}
				catch ( e ) {
					addLogMessage( client, 'Error when setting node label filter: ' + e.message );
				}
			},
			// This could be removed and the code could go into setNodeLabelFilter
			searchNodeByLabel: ( _root, variables, { cache, client } ) => {
				try {
					const { Nodes } = readNodesFromCache( client, cache, NODES_SEARCH_DATA, 'searchNodeByLabel' );
					const { searchString } = variables;
					const nodesCopy = deepCopy( Nodes );

					if ( searchString.length > 0 ) {
						let setCamCoords = false;
						let camCoords = { __typename: 'SetCameraPos', type: 'select', x: 0, y: 0 };
						const foundIDs = getMatchingIDs( nodesCopy, searchString );
						for ( let node of nodesCopy ) {
							// if the label of a node does not contains the search string
							if ( foundIDs.includes( node.id ) ) {
								// give the node a searchIndex
								const searchIndex = foundIDs.indexOf( node.id );
								node.searchIndex = searchIndex;
								// if the camera coordinates have not been set yet
								if ( searchIndex === 0 && !setCamCoords ) {
									setCamCoords = true;
									camCoords.x = node.x;
									camCoords.y = node.y;
								}
							}
							// if the label doesn't contain the search string remove the searchIndex prop
							else {
								node.searchIndex = '';
							}
						}
						setMaxNodeIndex( cache, foundIDs );
						setNodeSearchIndex( cache, 0 );
						setCameraPos( cache, camCoords );
					}

					else {
						setNodeSearchIndex( cache, '' );
						nodesCopy.forEach( aNode => {
							// remove searchIndex from all nodes
							aNode.searchIndex = '';
							return aNode;
						} );
					}

					writeNodesToCache( client, cache, NODES_SEARCH_DATA, { Nodes: nodesCopy }, 'searchNodeByLabel' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error when searching for node by label: ' + e.message );
				}
			},

			setLinkLabelFilter: ( _root, variables, { cache, client } ) => {
				try {
					const { string } = variables;
					writeToCache( client, cache, SEARCH_LINK_LABEL_FILTER, { searchLinkLabelFilter: string }, 'Error when writing LinkLabelFilter to cache in setLinkLabelFilter' );
					return string;
				}
				catch ( e ) {
					addLogMessage( client, 'Error when setting link label filter: ' + e.message );
				}
			},
			searchLinkByLabel: ( _root, variables, { cache, client } ) => {
				try {
					const { Links } = readLinksFromCache( client, cache, LINKS_HIDE_DATA, 'searchLinkByLabel' );
					const linksCopy = deepCopy( Links );
					const { searchString } = variables;
					if ( searchString.length > 0 ) {
						const fuse = new Fuse( linksCopy, options );
						const results = fuse.search( searchString );
						const goodResults = results.filter( aResult => aResult.score < 0.5 );
						const foundIDs = goodResults.map( aResult => aResult.item.id );
						for ( let link of linksCopy ) {
							// if the label of a link does not contain the search string
							if ( !foundIDs.includes( link.id ) ) {
								// if it is not hidden, hide it
								if ( !link.hidden ) {
									link.hidden = true;
								}
							}
							// if the label contains the search string and the link was previously hidden by a filter, make it visible
							else {
								link.hidden = false;
							}
						}
					}
					else {
						linksCopy.forEach( aLink => {
							aLink.hidden = false;
							return aLink;
						} );
					}

					writeLinksToCache( client, cache, LINKS_HIDE_DATA, { Links: linksCopy }, 'searchLinkByLabel' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error when searching link by label: ' + e.message );
				}
			},

			setCameraNodeIndex: ( _root, variables, { cache, client } ) => {
				writeToCache( client, cache, NODE_SEARCH_INDEX, { nodeSearchIndex: variables.index }, 'Error when writing nodeSearchIndex to cache in setCameraNodeIndex' );
			},
			setCameraPos: ( _root, variables, { cache, client } ) => {
				try {
					const { x, y, type = 'select' } = variables;
					writeToCache( client, cache, CAMERA_POS, {
						setCameraPos: {
							x,
							y,
							type,
							__typename: 'SetCameraPos',
						},
					}, 'Error when writing cameraPos to cache in setCameraPos' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error when setting camera pos: ' + e.message );
				}
			},

			addEditorAction: ( _root, variables, { cache, client } ) => {
				try {
					const { type, itemID, x, y } = variables;
					let { lastEditorActions } = readFromCache( client, cache, LAST_EDITOR_ACTIONS, 'Error when reading last editor actions from cache in addEditorAction' );
					if ( !lastEditorActions ) {
						lastEditorActions = [];
					}
					const clicksCopy = deepCopy( lastEditorActions );
					if ( type === 'zoom' && clicksCopy[0]?.type === 'zoom' ) {
						// if its a zoom event after a previous zoom event, only update the position
						clicksCopy[0].position.x = x;
						clicksCopy[0].position.y = y;
					}
					else if ( type === 'drag' && clicksCopy[0]?.type === 'drag' ) {
						// if its a drag event after a previous drag event, only update the position
						clicksCopy[0].position.x = x;
						clicksCopy[0].position.y = y;
					}
					else {
						// otherwise add the new action to the array
						clicksCopy.unshift( { __typename: 'EditorAction', type, itemID, position: { x, y } } );
					}
					// do not save more than 10 actions
					if ( clicksCopy.length >= 11 ) {
						clicksCopy.pop();
					}
					writeToCache( client, cache, LAST_EDITOR_ACTIONS, { lastEditorActions: clicksCopy }, 'Error when writing lastEditorActions in addEditorAction' );
				}
				catch ( e ) {
					addLogMessage( client, 'Error in addEditorAction: ' + e.message );
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
      searchNodeLabelFilter
      searchLinkLabelFilter
      maxNodeIndex
      nodeSearchIndex
      linkSearchIndex
      setCameraPos {
        type
        x
        y
      }
      activeItem {
        itemId
        itemType
      }
      lastEditorActions
    }
	`,
	data: {
		logMessages: [],
		hasEditRights: false,
		searchNodeLabelFilter: '',
		searchLinkLabelFilter: '',
		maxNodeIndex: '',
		nodeSearchIndex: '',
		linkSearchIndex: '',
		setCameraPos: {
			// can be 'fit' or 'select', init is in the beginning to use 'fit' from vis, 'select' when user searches
			type: '',
			x: 0,
			y: 0,
			__typename: 'SetCameraPos',
		},
		activeItem: {
			itemId: 'app',
			itemType: 'app',
			__typename: 'ActiveItem',
		},
		lastEditorActions: [],
	},
} );

export default (
	<ApolloProvider client={ client }>
		<Favicon url={ icon_url }/>
		<App/>
	</ApolloProvider>
);
