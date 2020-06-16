import {
	hasCoordinates, getExistingCoordinatesFor, hasPartOfLinks, isCollapsable, coordsExist, rotateVector, toRad, insertConnected, saveChildren,
	clamp,
} from './NodeUtils';
import { addLogMessage, normalizeVector, vectorMagnitude } from '../utils';

export const CollapsableRule = ( node, nodes, client, minDist = 1000 ) => {
	try {
		if ( isCollapsable( node ) ) {
			const otherCollapsables = nodes.filter( aNode => aNode.id !== node.id && isCollapsable( aNode ) && !aNode.deleted );
			// get the coordinates of all other collapsables
			const existingCoords = getExistingCoordinatesFor( otherCollapsables );

			let newCoords = {};
			// go from 0/0 and check if the coordinates are already taken by another node
			// if so, go in steps of minDist and check again
			loop1:
				for ( let y = 0, i = 0; i <= otherCollapsables.length / 2; i++, y += minDist ) {
					for ( let x = 0, j = 0; j <= otherCollapsables.length / 2; j++, x += minDist ) {
						newCoords = { x, y };
						if ( !coordsExist( newCoords, existingCoords ) ) {
							node.x = newCoords.x;
							node.y = newCoords.y;
							break loop1;
						}
					}
				}
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in CollapsableRule: ' + e.message );
	}
};

const PartOfRule = ( node, nodes, client, minDistToContainer = 150, minDistToEachOther = 50 ) => {
	try {
		if ( hasPartOfLinks( node ) && !isCollapsable( node ) ) {
			// get container ID the node is connected to
			const containerID = node.connectedTo.find( connNode => isCollapsable( connNode ) ).id;
			// get the coordinates of the container
			const container = nodes.find( aNode => aNode.id === containerID );
			// get its position
			const { x: containerX, y: containerY } = container;
			// and the count of its connected nodes
			const partOfCount = container.connectedTo.length;
			// get all other existing coordinates
			// todo: maybe I can find a more performant way than searching through all nodes?
			const existingCoords = getExistingCoordinatesFor( nodes );
			// place the node around the container
			let newCoords = {};
			loop1:
				for ( let y = 0, i = 0; i < partOfCount; y += minDistToEachOther, i++ ) {
					// max 3 nodes next to each other
					for ( let x = 0, j = 0; j < 3; x += minDistToEachOther, j++ ) {
						for ( let k = -1; k <= 1; k++ ) {
							newCoords = { x: containerX + k * minDistToContainer, y: containerY + minDistToContainer + y };
							if ( !coordsExist( newCoords, existingCoords ) ) {
								node.x = newCoords.x;
								node.y = newCoords.y;
								break loop1;
							}
						}
					}
				}
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in PartOfRule: ' + e.message );
	}
};

const NoConnectionNodeRule = ( node, nodes, client, minDistToContainer = 400, minDistToEachOther = 150 ) => {
	try {
		// check if node has no links connected to it
		if ( !isCollapsable( node ) && node.connectedTo.length === 0 && !hasCoordinates( node ) ) {
			// get all other nodes with no connections
			const otherSingleNodes = nodes.filter( checkNode => checkNode.connectedTo.length === 0 && checkNode.id !== node.id && !isCollapsable( checkNode ) );
			const existingCoords = getExistingCoordinatesFor( otherSingleNodes );

			let newCoords = {};
			// place above all other nodes that have connections? --> y = -400
			loop1:
				for ( let y = -minDistToContainer, i = 0; i <= otherSingleNodes.length; y -= minDistToEachOther, i++ ) {
					for ( let x = 0, j = 0; j <= otherSingleNodes.length; x += minDistToEachOther, j++ ) {
						newCoords = { x, y };
						if ( !coordsExist( newCoords, existingCoords ) ) {
							node.x = newCoords.x;
							node.y = newCoords.y;
							break loop1;
						}
					}
				}
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in NoConnectionNodeRule: ' + e.message );
	}
};

// maybe it'd be better to do this from the parent node?
const SingleConnectionRule = ( node, nodes, client, minDistToParent = 150, minDistToEachOther = 100 ) => {
	try {
		// todo: what if parent doesn't have coordinates yet?
		if ( !isCollapsable( node ) ) {
			const connectedToIDs = node.connectedTo.map( aNode => aNode.id );
			const distinctIDs = Array.from( new Set( connectedToIDs ) );
			// if the node has just one connected node
			if ( connectedToIDs.length === 1 || distinctIDs.length === 1 ) {
				// get the parent node
				const parentNode = nodes.find( aNode => aNode.id === connectedToIDs[0] );
				const { x: parentX, y: parentY } = parentNode;
				// and find its children
				const otherChildIDs = parentNode.connectedTo.map( aNode => aNode.id );
				const otherChilds = nodes.filter( aNode => otherChildIDs.includes( aNode.id ) );
				// get their coordinates
				const existingCoords = getExistingCoordinatesFor( otherChilds );
				// place them from left to right below the parent node
				let newCoords = {};
				loop1:
					for ( let i = 0, y = minDistToParent; i < 3; i++, y += minDistToEachOther ) {
						for ( let j = 0, x = -minDistToParent; j < 3; j++, x += minDistToEachOther ) {
							newCoords = { x: parentX + x, y: parentY + y };
							if ( !coordsExist( newCoords, existingCoords ) ) {
								node.x = newCoords.x;
								node.y = newCoords.y;
								break loop1;
							}
						}
					}
			}
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in SingleConnectionRule: ' + e.message );
	}
};

const LooseChildRule = ( _, nodes, client, minDistToParent = 150, minDistToEachOther = 100 ) => {
	try {
		// get all nodes that already have a position
		const nodesWithCoords = nodes.filter( node => node.x !== undefined && node.y !== undefined );
		// go through their connected nodes without position and assign one
		for ( let nodeWithCoord of nodesWithCoords ) {
			// handle the connected nodes
			handleConnectedNodes( nodeWithCoord, nodes, minDistToParent, minDistToEachOther );
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in LooseChildRule: ' + e.message );
	}
};

const handleConnectedNodes = ( nodeWithCoord, nodes, client, minDistToParent = 150, minDistToEachOther = 100 ) => {
	try {
		// get the child nodes
		const childIDs = nodeWithCoord.connectedTo.map( aNode => aNode.id );
		const childNodes = nodes.filter( aNode => childIDs.includes( aNode.id ) );
		// get the childs without coordinates
		const childNodesWithoutCoords = childNodes.filter( aNode => !hasCoordinates( aNode ) );
		if ( childNodesWithoutCoords.length > 0 ) {
			for ( let child of childNodesWithoutCoords ) {
				const childNode = childNodes.find( aNode => aNode.id === child.id );
				const { x: parentX, y: parentY } = nodeWithCoord;
				const existingCoords = getExistingCoordinatesFor( nodes );
				// assign coordinates to the child
				let newCoords = {};
				loop1:
					for ( let i = 0, y = minDistToParent; i < 3; i++, y += minDistToEachOther ) {
						for ( let j = 0, x = -minDistToParent; j < 3; j++, x += minDistToEachOther ) {
							newCoords = { x: parentX + x, y: parentY + y };
							if ( !coordsExist( newCoords, existingCoords ) ) {
								childNode.x = newCoords.x;
								childNode.y = newCoords.y;
								break loop1;
							}
						}
					}
				// check if the child as connected nodes that do not have coordinates yet
				handleConnectedNodes( childNode, nodes, client, minDistToParent, minDistToEachOther );
			}
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in handleConnectedNodes: ' + e.message );
	}
};

export const NonCollapsableRule = ( _, nodes, client, minDistToEachOther = 500 ) => {
	try {
		// get nodes without coordinates
		const nodesWithoutCoords = nodes.filter( aNode => aNode.x === undefined && aNode.y === undefined );
		if ( nodesWithoutCoords.length > 0 ) {
			handleNodesWithoutCoords( nodesWithoutCoords, nodes, client, minDistToEachOther );
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in NonCollapsableRule: ' + e.message );
	}
};

const handleNodesWithoutCoords = ( nodesWithoutCoords, nodes, client, minDistToEachOther = 500 ) => {
	try {
		// get node with most links
		let nodeWithMostLinks = nodesWithoutCoords.reduce( ( acc, next ) => {
			if ( next.connectedTo.length >= acc.connectedTo.length ) {
				return next;
			}
			return acc;
		}, { connectedTo: [] } );
		// assign it a position
		let newCoords = {};
		const existingCoords = getExistingCoordinatesFor( nodes );
		loop1:
			for ( let y = -500, i = 0; ; y -= minDistToEachOther, i++ ) {
				for ( let x = -500, j = 0; ; x -= minDistToEachOther, j++ ) {
					newCoords = { x, y };
					if ( !coordsExist( newCoords, existingCoords ) ) {
						const node = nodes.find( aNode => aNode.id === nodeWithMostLinks.id );
						node.x = newCoords.x;
						node.y = newCoords.y;
						node.contains = [];
						insertConnected( node, node, nodes, 1 );
						saveChildren( node, nodes );
						// handle all nodes connected to this one
						FlowerRule2( nodes, node, 1, client );
						break loop1;
					}
				}
			}
		// if there's still nodes without position, repeat the procedure
		nodesWithoutCoords = nodes.filter( aNode => aNode.x === undefined && aNode.y === undefined );
		if ( nodesWithoutCoords.length > 0 ) {
			handleNodesWithoutCoords( nodesWithoutCoords, nodes, client );
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in handleNodesWithoutCoords: ' + e.message );
	}
};

const rules = [ CollapsableRule, PartOfRule, NoConnectionNodeRule, LooseChildRule, NonCollapsableRule ];

export const FlowerRule = ( node, nodes, client, distanceToContainer = 200 ) => {
	// node is a collapsable with coordinates
	// nodes is a deep copy of all other nodes
	try {
		if ( isCollapsable( node ) ) {
			// get all connected nodes
			const connectedNodeIDs = node.connectedTo.map( aNode => aNode.id );
			// get their references, only if they do not have coordinates yet
			const connectedNodes = nodes.filter( aNode => connectedNodeIDs.includes( aNode.id ) && !hasCoordinates( aNode ) );
			// all nodes connected to a collapsable, can be distributed 360° around it.
			// to get a uniform distribution we need to divide this angle by the amount of connected nodes
			let deltaAngle = 360 / connectedNodes.length;
			// if there are just 2 nodes, reduce the angle as a connection between them might cover up labels
			if ( connectedNodes.length === 2 ) {
				deltaAngle = deltaAngle * 2 / 3;
			}
			const deltaRad = deltaAngle * Math.PI / 180;
			// domains themselves rarely have other connections other than to their part-of nodes, so we start placing them on the top left
			// and then go clockwise, placing one node each deltaAngle degrees
			let vec = { x: -1, y: -1 };
			let normalized = normalizeVector( vec );
			for ( let i = 1; i <= connectedNodes.length; i++ ) {
				const newX = node.x + normalized.x * distanceToContainer;
				const newY = node.y + normalized.y * distanceToContainer;
				const leafNode = nodes.find( aNode => aNode.id === connectedNodes[i - 1].id );
				leafNode.x = newX;
				leafNode.y = newY;
				// after placing the node, calculate a new vector that is rotated i * delta rad
				let newVec = {
					x: vec.x * Math.cos( i * deltaRad ) - vec.y * Math.sin( i * deltaRad ),
					y: vec.y * Math.cos( i * deltaRad ) + vec.x * Math.sin( i * deltaRad ),
				};
				normalized = normalizeVector( newVec );
			}
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in FlowerRule: ' + e.message );
	}
};

// todo: calculate new area depending on level and direction vector
// todo: adapt distance to each other according to level
export const FlowerRule2 = ( nodes, parent, level, client, distanceToOther = 350, minDist = 150 ) => {
	try {
		const { children } = parent;
		if ( children ) {
			// level === 1 means that its the first step from center
			if ( level === 1 ) {
				// domains themselves rarely have other connections other than to their part-of nodes, so we start placing them on the top left
				// and then go clockwise, placing one node each deltaAngle degrees
				const initVec = { x: -1, y: -1 };
				let normalized = normalizeVector( initVec );
				let i = 1;
				// all nodes connected to a collapsable, can be distributed 360° around it.
				// to get a uniform distribution we need to divide this angle by the amount of connected nodes
				let deltaAngle = 360 / children.length;
				// if there are just 2 nodes, reduce the angle as a connection between them might cover up labels
				if ( children.length === 2 ) {
					deltaAngle = deltaAngle * 2 / 3;
				}
				const deltaRad = toRad( deltaAngle );
				for ( let node of children ) {
					const newX = parent.x + normalized.x * clamp( distanceToOther, minDist );
					const newY = parent.y + normalized.y * clamp( distanceToOther, minDist );
					node.x = newX;
					node.y = newY;
					// save the direction vector in the node to know where to orient the child vectors
					node.dirVector = normalized;
					// after placing the node, calculate a new vector that is rotated i * delta rad
					let newVec = rotateVector( initVec, i * deltaRad );
					normalized = normalizeVector( newVec );
					i++;
				}
			}
				// otherwise the parent node will have a dirVector property
				// nodes can be allocated +-90° around this direction vector
				// rotate the vector by -90°, get the amount of child nodes and divide 180° by this number
			// then rotate the vector once by the delta angle (in rad) / 2 and from here on place the first node each delta angle degrees
			else {
				const { dirVector } = parent;
				const zeroVec = rotateVector( dirVector, toRad( -90 ) );
				const deltaAngle = 180 / children.length;
				const deltaRad = toRad( deltaAngle );
				const initVec = rotateVector( zeroVec, deltaRad / 2 );
				let normalized = normalizeVector( initVec );
				let i = 1;
				for ( let node of children ) {
					const newX = parent.x + normalized.x * clamp( distanceToOther, minDist );
					const newY = parent.y + normalized.y * clamp( distanceToOther, minDist );
					node.x = newX;
					node.y = newY;
					node.dirVector = normalized;
					let newVec = rotateVector( initVec, i * deltaRad );
					normalized = normalizeVector( newVec );
					i++;
				}
			}
			// now handle the children of each child
			for ( let node of children ) {
				FlowerRule2( nodes, node, level + 1, client, distanceToOther * 2 / 3 );
			}
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in FlowerRule2: ' + e.message );
	}
};

export default rules;
