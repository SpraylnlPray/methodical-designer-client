import { isCollapsable } from '../utils';

export const CollapsableRule = ( node, nodes, minDist = 800 ) => {
	if ( isCollapsable( node ) ) {
		const otherCollapsables = nodes.filter( candidate => candidate.id !== node.id && isCollapsable( candidate ) && !candidate.deleted );
		// get the coordinates of all other collapsables
		const existingCoords = getExistingCoordinatesFor( otherCollapsables );

		let newCoords = {};
		// if there have already been other coords set
		if ( existingCoords.length > 0 ) {
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
		else {
			node.x = 0;
			node.y = 0;
		}
	}
};

const coordsExist = ( coord, coords ) => {
	for ( let coordsToCheck of coords ) {
		if ( coord.x === coordsToCheck.x && coord.y === coordsToCheck.y ) {
			return true;
		}
	}
	return false;
};

export const PartOfRule = ( node, nodes, minDistToContainer = 150, minDistToEachOther = 50 ) => {
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
};

const getConnectedLinkTypes = ( links ) => {
	const types = [];
	links.forEach( link => {
		types.push( link.type );
	} );
	return types;
};

const hasPartOfLinks = ( node ) => {
	const types = getConnectedLinkTypes( node.Links );
	return types.includes( 'PartOf' );
};

export const NoConnectionNodeRule = ( node, nodes, minDistToContainer = 400, minDistToEachOther = 150 ) => {
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
};

// maybe it'd be better to do this from the parent node?
export const SingleConnectionRule = ( node, nodes, minDistToParent = 150, minDistToEachOther = 100 ) => {
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
};

export const LooseChildRule = ( nodes, minDistToParent = 150, minDistToEachOther = 100 ) => {
	// get all nodes that already have a position
	const nodesWithCoords = nodes.filter( node => node.x !== undefined && node.y !== undefined );
	// go through their connected nodes without position and assign one
	for ( let nodeWithCoord of nodesWithCoords ) {
		// handle the connected nodes
		handleConnectedNodes( nodeWithCoord, nodes, minDistToParent, minDistToEachOther );
	}
};

const handleConnectedNodes = ( nodeWithCoord, nodes, minDistToParent = 150, minDistToEachOther = 100 ) => {
	// get the child nodes
	const childIDs = nodeWithCoord.connectedTo.map( aNode => aNode.id );
	const childNodes = nodes.filter( aNode => childIDs.includes( aNode.id ) );
	// get the childs without coordinates
	const childNodesWithoutCoords = childNodes.filter( aNode => aNode.x === undefined && aNode.y === undefined );
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
			handleConnectedNodes( childNode, nodes, minDistToParent, minDistToEachOther );
		}
	}
};

const hasCoordinates = node => {
	const { x, y } = node;
	return x !== undefined && y !== undefined;
};

const getExistingCoordinatesFor = nodesToConsider => {
	const existingCoords = [];
	nodesToConsider.forEach( nodeToCheck => {
		const { x, y } = nodeToCheck;
		if ( x !== undefined && y !== undefined ) {
			existingCoords.push( { x, y } );
		}
	} );
	return existingCoords;
};

export const NonDomainRule = ( nodes, minDistToEachOther = 500 ) => {
	// get nodes without coordinates
	const nodesWithoutCoords = nodes.filter( aNode => aNode.x === undefined && aNode.y === undefined );
	if ( nodesWithoutCoords.length > 0 ) {
		handleNodesWithoutCoords( nodesWithoutCoords, nodes );
	}
};

const handleNodesWithoutCoords = ( nodesWithoutCoords, nodes, minDistToEachOther = 500 ) => {
	// get node with most links
	let nodeWithMostLinks = nodesWithoutCoords.reduce( ( acc, next ) => {
		if ( next.connectedTo.length > acc.connectedTo.length ) {
			return next;
		}
		return acc;
	}, { connectedTo: [] } );
	// assign it a position
	let newCoords = {};
	const existingCoords = getExistingCoordinatesFor( nodes );
	loop1:
		for ( let y = -500, i = 0; i < nodesWithoutCoords.length / 2; y -= minDistToEachOther, i++ ) {
			for ( let x = -500, j = 0; j < nodesWithoutCoords.length / 2; x += minDistToEachOther, j++ ) {
				newCoords = { x, y };
				if ( !coordsExist( newCoords, existingCoords ) ) {
					const node = nodes.find( aNode => aNode.id === nodeWithMostLinks.id );
					node.x = newCoords.x;
					node.y = newCoords.y;
					handleConnectedNodes( node, nodes, -150, -100 );
					break loop1;
				}
			}
		}
		// if there's still nodes without position, repeat the procedure
	nodesWithoutCoords = nodes.filter( aNode => aNode.x === undefined && aNode.y === undefined );
	if ( nodesWithoutCoords.length > 0 ) {
		handleNodesWithoutCoords( nodesWithoutCoords, nodes );
	}
};
