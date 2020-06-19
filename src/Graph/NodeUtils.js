import { NodeImages } from './Images';
import { NodeShapes } from './Shapes';
import { NodeColors } from './Colors';
import { addLogMessage, deepCopy, generateLocalUUID } from '../utils';
import { CollapsableRule, FlowerRule, NonCollapsableRule } from './Rules';
import { MAX_NODE_INDEX, NODE_SEARCH_INDEX, NODES_BASE_DATA } from '../queries/LocalQueries';

export const areBothHidden = ( node1, node2 ) => {
	return isHidden( node1 ) && isHidden( node2 );
};

export const isHidden = ( node ) => {
	return node.hidden;
};

export const setNodeImage = ( node ) => {
	if ( NodeImages[node.nodeType] ) {
		node.image = NodeImages[node.nodeType];
		node.shape = 'image';
	}
	else {
		node.shape = NodeShapes[node.nodeType];
		node.color = NodeColors[node.nodeType];
	}
};

export const VecDist = ( p1, p2 ) => {
	const deltaX = p1.x - p2.x;
	const deltaY = p1.y - p2.y;
	return Math.hypot( deltaX, deltaY );
};

export const handleConnectedNodes = ( collapsable, sourceNode, links, nodesCopy ) => {
	let nodesWithoutCollapsable = nodesCopy.filter( node => node.id !== collapsable.id );

	// get all nodes connected to the collapsable via a part-of link
	const connectedNodeIDs = [];
	for ( let link of links ) {
		// if the x/parent node is the collapsable, save the y ID
		if ( link.x.id === collapsable.id && link.linkType === 'PartOf' ) {
			connectedNodeIDs.push( link.y.id );
		}
	}
	// set their hidden property to the ones of the container/domain that initiated the expand/collapse action
	nodesWithoutCollapsable.forEach( node => {
		if ( connectedNodeIDs.includes( node.id ) ) {
			node.changedVisibility = true;
			node.hidden = sourceNode.collapsed;
			// if the node gets hidden, make sure to save which node is the source of the hide action
			if ( node.hidden ) {
				node.hiddenBy = sourceNode.id;
			}
			// if the adapted node is a collapsable itself, it should also hide its respective children
			if ( isCollapsable( node ) ) {
				handleConnectedNodes( node, collapsable, links, nodesCopy );
			}
		}
	} );
	return nodesWithoutCollapsable;
};

export const isCollapsable = ( node ) => {
	return node.nodeType === 'Container' || node.nodeType === 'Domain';
};

export const hasCoordinates = node => {
	const { x, y } = node;
	return x !== undefined && y !== undefined;
};

export const getExistingCoordinatesFor = nodesToConsider => {
	const existingCoords = [];
	nodesToConsider.forEach( nodeToCheck => {
		const { x, y } = nodeToCheck;
		if ( x !== undefined && y !== undefined ) {
			existingCoords.push( { x, y } );
		}
	} );
	return existingCoords;
};

export const getConnectedLinkTypes = ( links ) => {
	const types = [];
	links.forEach( link => {
		types.push( link.linkType );
	} );
	return types;
};

export const hasPartOfLinks = ( node ) => {
	const types = getConnectedLinkTypes( node.Links );
	return types.includes( 'PartOf' );
};

export const coordsExist = ( coord, coords ) => {
	for ( let coordsToCheck of coords ) {
		if ( coord.x === coordsToCheck.x && coord.y === coordsToCheck.y ) {
			return true;
		}
	}
	return false;
};

export const removeLinkFromLinks = ( node, link ) => {
	let linkIDs = node.Links.map( aLink => aLink.id );
	let indexLink = linkIDs.indexOf( link.id );
	node.Links.splice( indexLink, 1 );
};

export const removeNodeFromConnTo = ( node, nodeToRemove ) => {
	let connToIDs = node.connectedTo.map( aNode => aNode.id );
	let indexNode = connToIDs.indexOf( nodeToRemove.id );
	node.connectedTo.splice( indexNode, 1 );
};

export const addLinkToLinks = ( node, link ) => {
	node.Links.push( { __typename: 'Link', id: link.id, linkType: link.linkType } );
};

export const addNodeToConnTo = ( node, nodeToAdd ) => {
	node.connectedTo.push( { __typename: 'Node', id: nodeToAdd.id, nodeType: nodeToAdd.nodeType } );
};

export const assembleNewNode = ( variables ) => {
	const { label, props, nodeType } = variables;

	const newId = generateLocalUUID();
	let newNode = {
		id: newId,
		label,
		nodeType,
		connectedTo: [],
		Links: [],
		...props,
		created: true,
		edited: false,
		deleted: false,
		needsCalculation: true,
		__typename: 'Node',
	};
	setNodeImage( newNode );
	return newNode;
};

export const updateNode = ( node, variables ) => {
	const { props } = variables;
	node = deepCopy( node );

	for ( let prop in props ) {
		if ( prop !== 'collapse' ) {
			// collapse shouldn't count as a change that needs to be saved
			node.edited = true;
		}
		node[prop] = props[prop];
	}
	setNodeImage( node );
	return node;
};

export const insertConnected = ( node, center, nodes, level, client ) => {
	try {
		if ( !center[level] ) {
			center[level] = [];
		}
		// get all connected nodes
		const connectedNodes = getConnectedNodes( node, nodes, center );
		const distinctIDs = getDistinctIDs( connectedNodes );
		// get their reference
		for ( let ID of distinctIDs ) {
			let ref = nodes.find( aNode => aNode.id === ID );
			ref = formatRef( ref );
			// save that this combination has been checked
			ref.checkedBy.push( center.id );
			// if the ref hasn't been checked by this collapsable, mark it as checked
			if ( !isCollapsable( ref ) ) {
				// if the node has not been added to any level, save it
				if ( !ref.level ) {
					ref.level = level;
					ref.centerIDs.push( center.id );
					center.contains.push( { id: ref.id, parentID: node.id } );
				}
				else if ( level < ref.level ) {
					// check through all other collapsables if the "contains" property contains the link of this ref
					for ( let node2 of nodes ) {
						if ( isCollapsable( node2 ) && node2.contains ) {
							const containsIDs = node2.contains.map( conNode => conNode.id );
							if ( containsIDs.includes( ref.id ) ) {
								// remove the reference from "contains"
								const indexData = containsIDs.indexOf( ref.id );
								node2.contains.splice( indexData, 1 );
							}
						}
					}
					// then set the new level of the node
					ref.level = level;
					ref.centerIDs = [ center.id ];
					center.contains.push( { id: ref.id, parentID: node.id } );
				}
					// todo: this needs to be reworked
				// the level is the same and it doesn't know of this parent yet, add it to the current collapsable, and mark it as double
				else if ( level === ref.level ) {
					// do I need to remove it from other centers "contains" array?
					ref.double = true;
					ref.level = level;
					ref.centerIDs.push( center.id );
					center.contains.push( { id: ref.id, parentID: node.id } );
				}
			}
		}
		// go through the children and add their kids
		for ( let ID of distinctIDs ) {
			const ref = nodes.find( aNode => aNode.id === ID );
			insertConnected( ref, center, nodes, level + 1, client );
		}
	}
	catch ( e ) {
		addLogMessage( client, 'error with node ' + node.label + ' collapsable ' + center.label + ' level ' + level + ': ' + e.message );
	}
};

export const rotateVector = ( vec, angle ) => {
	return {
		x: vec.x * Math.cos( angle ) - vec.y * Math.sin( angle ),
		y: vec.y * Math.cos( angle ) + vec.x * Math.sin( angle ),
	};
};

export const toRad = ( angle ) => {
	return angle * Math.PI / 180;
};

export const saveChildren = ( center, nodes ) => {
	for ( let nodeRef of center.contains ) {
		const { id, parentID } = nodeRef;
		const node = nodes.find( aNode => aNode.id === id );
		const parent = nodes.find( aNode => aNode.id === parentID );
		if ( !parent.children ) {
			parent.children = [];
		}
		parent.children.push( node );
	}
};

export const clamp = ( val, min, max ) => {
	if ( val > max ) {
		val = max;
	}
	if ( val < min ) {
		val = min;
	}
	return val;
};

export const calcDistance = ( node ) => {
	// the distance form its parent should depend on the amount of children a node has
	// --> many children <-> big distance
	let dist = 150;
	if ( node.children ) {
		dist = 100 + 50 * node.children.length;
	}
	return dist;
};

export const placeNodes = ( nodesCopy, client ) => {
	const networkData = [];
	for ( let node of nodesCopy ) {
		node.checkedBy = [];
		CollapsableRule( node, nodesCopy, client );
		if ( isCollapsable( node ) ) {
			node.level = 0;
			networkData.push( node );
		}
	}

	const level = 1;
	for ( let collapsable of networkData ) {
		// this will hold id and level of all connected nodes
		collapsable.contains = [];
		insertConnected( collapsable, collapsable, nodesCopy, level, client );
	}

	// save all the children of one node on itself
	for ( let collapsable of networkData ) {
		saveChildren( collapsable, nodesCopy );
	}

	for ( let collapsable of networkData ) {
		FlowerRule( nodesCopy, collapsable, level, client );
	}
	NonCollapsableRule( {}, nodesCopy, client );
};

const getConnectedNodes = ( node, nodes, center ) => {
	const connectedNodes = node.connectedTo.filter( aNode => {
		if ( !isCollapsable( aNode ) && aNode.id !== center.id ) {
			const ref = nodes.find( bNode => bNode.id === aNode.id );
			if ( !ref?.checkedBy.includes( center.id ) ) {
				return true;
			}
		}
		return false;
	} );
	return connectedNodes;
};

const formatRef = ref => {
	if ( !ref.centerIDs ) {
		// under which node(s) it should be, is an array because it can be multiple arrays if there are multiple connections
		ref.centerIDs = [];
	}
	if ( !ref.checkedBy ) {
		// by which nodes has it been checked already?
		ref.checkedBy = [];
	}
	return ref;
};

const getDistinctIDs = nodeArray => {
	let connectedNodeIDs = nodeArray.map( aNode => aNode.id );
	const distinctIDs = Array.from( new Set( connectedNodeIDs ) );
	return distinctIDs;
};

export const pasteNodeToClipboard = ( activeItem, client ) => {
	const { itemId } = activeItem;
	const { Nodes } = client.readQuery( { query: NODES_BASE_DATA } );
	const nodeToCopy = Nodes.find( aNode => aNode.id === itemId );
	const nodeCopy = deepCopy( nodeToCopy );
	const { label, nodeType, story, synchronous, unreliable } = nodeCopy;
	navigator.clipboard.writeText( JSON.stringify( { label, nodeType, story, synchronous, unreliable, isNode: true } ) )
		.catch( error => addLogMessage( client, 'Error when saving to clipboard: ' + error.message ) );
};

export const createNodeFromClipboard = ( editingData, clipText, createNode, client ) => {
	if ( editingData.hasEditRights ) {
		const clipBoardData = JSON.parse( clipText );
		if ( clipBoardData.isNode ) {
			const { label, nodeType, story, synchronous, unreliable } = clipBoardData;
			createNode( {
				variables: {
					label, nodeType, props: { story, synchronous, unreliable },
				},
			} )
				.catch( e => addLogMessage( client, 'Error when creating node from paste command: ' + e.message ) );
		}
	}
};

export const setMaxNodeIndex = ( cache, foundIDs ) => {
	cache.writeQuery( {
		query: MAX_NODE_INDEX,
		data: { maxNodeIndex: foundIDs.length - 1 },
	} );
};

export const setNodeSearchIndex = ( cache, index ) => {
	cache.writeQuery( {
		query: NODE_SEARCH_INDEX,
		data: { nodeSearchIndex: index },
	} );
}