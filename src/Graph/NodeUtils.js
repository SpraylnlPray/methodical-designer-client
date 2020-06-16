import { NodeImages } from './Images';
import { NodeShapes } from './Shapes';
import { NodeColors } from './Colors';
import { deepCopy, generateLocalUUID } from '../utils';

export const areBothHidden = ( node1, node2 ) => {
	return isHidden( node1 ) && isHidden( node2 );
};

export const isHidden = ( node ) => {
	return node.hidden;
};

export const setNodeImage = ( node ) => {
	if ( NodeImages[node.type] ) {
		node.image = NodeImages[node.type];
		node.shape = 'image';
	}
	else {
		node.shape = NodeShapes[node.type];
		node.color = NodeColors[node.type];
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
		if ( link.x.id === collapsable.id && link.type === 'PartOf' ) {
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
	return node.type === 'Container' || node.type === 'Domain';
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
		types.push( link.type );
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
	node.Links.push( { __typename: 'Link', id: link.id, type: link.type } );
};

export const addNodeToConnTo = ( node, nodeToAdd ) => {
	node.connectedTo.push( { __typename: 'Node', id: nodeToAdd.id, type: nodeToAdd.type } );
};

export const assembleNewNode = ( variables ) => {
	const { label, props, type } = variables;

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

export const insertConnected = ( node, center, nodes, level ) => {
	try {
		if ( !center[level] ) {
			center[level] = [];
		}
		// get all connected nodes
		const connectedNodes = node.connectedTo.filter( aNode => {
			if ( !isCollapsable( aNode ) && aNode.id !== center.id ) {
				const ref = nodes.find( bNode => bNode.id === aNode.id );
				if ( !ref.checkedBy.includes( center.id ) ) {
					return true;
				}
			}
			return false;
		} );
		let connectedNodeIDs = connectedNodes.map( aNode => aNode.id );
		const distinctIDs = Array.from( new Set( connectedNodeIDs ) );
		// get their reference
		for ( let ID of distinctIDs ) {
			const ref = nodes.find( aNode => aNode.id === ID );
			if ( !ref.collapsableIDs ) {
				// under which node(s) it should be, is an array because it can be multiple arrays if there are multiple connections
				ref.collapsableIDs = [];
			}
			if ( !ref.checkedBy ) {
				// contains the containers which have already checked this node
				ref.checkedBy = [];
			}
			// if the ref hasn't been checked by this collapsable, mark it as checked
			if ( !ref.checkedBy.includes( center.id ) ) {
				ref.checkedBy.push( center.id );
				if ( !isCollapsable( ref ) ) {
					// if the node has not been added to any level, save it
					if ( !ref.level ) {
						ref.level = level;
						ref.parentID = node.id;
						ref.collapsableIDs.push( center.id );
						center[level].push( ref );
						center.contains.push( { id: ref.id, level } );
					}
					else if ( level < ref.level ) {
						// check through all other collapsables if the "contains" property contains the link of this ref
						for ( let node2 of nodes ) {
							if ( isCollapsable( node2 ) && node2.contains ) {
								const containsIDs = node2.contains.map( conNode => conNode.id );
								if ( containsIDs.includes( ref.id ) ) {
									// go to the level, remove the reference, then remove the reference from "contains"
									const containsData = node2.contains.find( conNode => conNode.id === ref.id );
									const { level } = containsData;
									// remove the reference from the level
									const levelIDs = node2[level].map( conNode => conNode.id );
									const levelIndex = levelIDs.indexOf( ref.id );
									node2[level].splice( levelIndex, 1 );
									// remove the reference from the "contains" property
									const indexData = containsIDs.indexOf( ref.id );
									node2.contains.splice( indexData, 1 );
								}
							}
						}
						// then set the new level of the node
						ref.level = level;
						ref.collapsableIDs = [ center.id ];
						ref.parentID = node.id;
						// and add the ref to the current collapsable
						center[level].push( ref );
						center.contains.push( { id: ref.id, level } );
					}
						// todo: check if this works and then apply it in rule!
					// the level is the same and it doesn't know of this parent yet, add it to the current collapsable, and mark it as double
					else if ( level === ref.level && !ref.collapsableIDs.includes( center.id ) ) {
						ref.double = true;
						ref.collapsableIDs.push( center.id );
						ref.parentID = node.id;
						center[level].push( ref );
						center.contains.push( { id: ref.id, level } );
					}
				}
			}
		}
		// go through the children and add their kids
		for ( let ID of connectedNodeIDs ) {
			const ref = nodes.find( aNode => aNode.id === ID );
			insertConnected( ref, center, nodes, level + 1 );
		}
	}
	catch ( e ) {
		console.log( 'error with node ' + node.label + ' collapsable ' + center.label + ' level ' + level + ': ' + e.message );
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

export const saveChildren = (node, nodes) => {
	for ( let level = 1; ; level++ ) {
		if ( node[level] ) {
			for ( let childNode of node[level] ) {
				// debugger
				const parent = nodes.find( aNode => aNode.id === childNode.parentID );
				if ( !parent.children ) {
					parent.children = [];
				}
				parent.children.push( childNode );
			}
		}
		else {
			break;
		}
	}
}