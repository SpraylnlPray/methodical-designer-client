import { NodeImages } from './Images';
import { NodeShapes } from './Shapes';
import { NodeColors } from './Colors';
import { addLogMessage, deepCopy, generateLocalUUID } from '../utils';
import {  FlowerRule, NonCollapsableRule, CollaspableRule } from './Rules';
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
	const deltaX = p1.position.x - p2.position.x;
	const deltaY = p1.position.y - p2.position.y;
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
	const { position } = node;
	return position !== undefined;
};

export const getExistingCoordinatesFor = nodesToConsider => {
	const existingCoords = [];
	nodesToConsider.forEach( nodeToCheck => {
		const { position } = nodeToCheck;
		if ( position ) {
			existingCoords.push( position );
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

export const rotateVector = ( vec, angle ) => {
	return {
		x: vec.x * Math.cos( angle ) - vec.y * Math.sin( angle ),
		y: vec.y * Math.cos( angle ) + vec.x * Math.sin( angle ),
	};
};

export const toRad = ( angle ) => {
	return angle * Math.PI / 180;
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

export const assignChildren = ( nodes ) => {
	for ( let node of nodes ) {
		if ( node.parents && !node.position ) {
			for ( let parent of node.parents ) {
				if ( !parent.children ) {
					parent.children = [];
				}
				parent.children.push( node );
			}
		}
	}
};

export const findParents = ( parent, center, nodes, toCheck, checked, client ) => {
	try {
		// get all connected node ids
		const connectedNodeRefs = getConnectedNodes( parent, nodes, center );
		const distinctIDs = getDistinctIDs( connectedNodeRefs );
		for ( let nodeID of distinctIDs ) {
			const ref = nodes.find( aNode => aNode.id === nodeID );
			if ( !ref.parents ) {
				ref.parents = [];
			}
			// if the node is not on the list of nodes to check, nor is it in the list of already checked nodes
			if ( !toCheck.includes( ref ) && !checked.includes( ref ) ) {
				toCheck.push( ref );
				// if the node doesn't have a center
				if ( !ref.center ) {
					// set the centerID, save the level and the parent
					ref.center = center;
					ref.level = parent.level + 1;
					ref.parents.push( parent );
				}
				// if it has a center
				else {
					// check if its a different than the current one
					if ( ref.center !== center ) {
						// if so, if the nodes level is higher than the new level
						if ( ref.level > parent.level + 1 ) {
							// set the new center, level and parent
							ref.center = center;
							ref.level = parent.level + 1;
							ref.parents = [ parent ];
						}
					}
				}
			}
			else {
				// if it was already discovered, check if it is one level below the current node
				if ( ref.level === parent.level + 1 && !ref.parents.includes( parent ) ) {
					ref.parents.push( parent );
				}
			}
		}

		const nodeToCheck = toCheck.shift();
		if ( nodeToCheck ) {
			checked.push( nodeToCheck );
			if ( !nodeToCheck.children ) {
				nodeToCheck.children = [];
			}
			findParents( nodeToCheck, center, nodes, toCheck, checked, client );
		}
	}
	catch ( e ) {
		addLogMessage( client, 'error in findParents with node ' + parent.label + ': ' + e.message );
	}
};

export const placeNodes = ( nodesCopy, client ) => {
	const collapsables = [];
	for ( let node of nodesCopy ) {
		if ( isCollapsable( node ) ) {
			node.level = 0;
			node.children = [];
			collapsables.push( node );
		}
	}

	for ( let collapsable of collapsables ) {
		const toCheck = [];
		const checked = [];
		findParents( collapsable, collapsable, nodesCopy, toCheck, checked, client );
	}

	assignChildren( nodesCopy );
	const limit = calculateCollapsableBoundaries( collapsables );
	for ( let collapsable of collapsables ) {
		CollaspableRule( collapsable, collapsables, client, limit );
	}

	for ( let collapsable of collapsables ) {
		const next = [].concat( collapsable.children );
		FlowerRule( next, client );
	}

	for ( let node of nodesCopy ) {
		convertToVisCoords( node );
	}

	NonCollapsableRule( {}, nodesCopy, client );
};

export const normalizeCoords = ( node ) => {
	if ( hasCoordinates( node ) ) {
		if ( node.parents ) {
			node.position = divideVec( node.position, node.parents.length );
		}
	}
};

export const convertToVisCoords = ( node ) => {
	if ( node.position ) {
		const { x, y } = node.position;
		node.x = x;
		node.y = y;
	}
};

const getConnectedNodes = ( node, nodes, center ) => {
	const connectedNodes = node.connectedTo.filter( aNode => {
		return !isCollapsable( aNode ) && aNode.id !== center.id;
	} );
	return connectedNodes;
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
};

export const addVertex = ( vec1, vec2 ) => {
	let newVec = { x: 0, y: 0 };
	newVec.x = vec1.x + vec2.x;
	newVec.y = vec1.y + vec2.y;
	return newVec;
};

export const divideVec = ( vec, factor ) => {
	let newVec = { x: 0, y: 0 };
	newVec.x = vec.x / factor;
	newVec.y = vec.y / factor;
	return newVec;
};

export const isPrime = ( num ) => {
	if ( num < 2 ) {
		return false;
	}
	for ( let i = 2; i < num; i++ ) {
		if ( !( num % i ) ) {
			return false;
		}
	}
	return true;
}

export const calculateCollapsableBoundaries = ( allCollapsables ) => {
	let elementCountUsed = allCollapsables.length;
	if ( isPrime( allCollapsables.length ) ) {
		elementCountUsed -= 1;
	}

	let limit = 0;
	for ( let i = 2; i < elementCountUsed / 2; i++ ) {
		limit = Math.floor( elementCountUsed / i );
		if ( isPrime( limit ) ) {
			if ( limit < elementCountUsed / 2 ) {
				return limit;
			}
		}
		else {
			if ( limit <= elementCountUsed / 3 ) {
				return limit;
			} 
		}				
	}
}