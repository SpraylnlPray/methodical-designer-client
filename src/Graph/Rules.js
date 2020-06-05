import { isCollapsable } from '../utils';

export const CollapsableRule = ( node, nodes, minDist = 500 ) => {
	if ( isCollapsable( node ) ) {
		const otherCollapsables = nodes.filter( candidate => candidate.id !== node.id && isCollapsable( candidate ) && !candidate.deleted );
		// get the coordinates of all other collapsables
		const existingCoords = [];
		otherCollapsables.forEach( collapsable => {
			const { x, y } = collapsable;
			if ( x !== undefined && y !== undefined ) {
				existingCoords.push( { x, y } );
			}
		} );

		let newCoords = {};
		// if there have already been other coords set
		if ( existingCoords.length > 0 ) {
			// go from 0/0 and check if the coordinates are already taken by another node
			// if so, go in steps of minDist and check again
			loop1:
				for ( let y = 0, i = 0; i <= otherCollapsables.length / 2; i++, y += minDist ) {
					for ( let x = 0, j = 0; j <= otherCollapsables.length / 2; j++, x += minDist ) {
						newCoords = { x, y };
						for ( let k = 0; k < existingCoords.length; k++ ) {
							if ( !coordsExist( newCoords, existingCoords ) ) {
								node.x = newCoords.x;
								node.y = newCoords.y;
								break loop1;
							}
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
		const existingCoords = [];
		nodes.forEach( nodeToCheck => {
			const { x, y } = nodeToCheck;
			if ( x !== undefined && y !== undefined ) {
				existingCoords.push( { x, y } );
			}
		} );
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

export const NoConnectionNodeRule = ( node, nodes, minDistToEachOther = 150 ) => {
	// check if node has no links connected to it
	if ( node.connectedTo.length === 0 && !hasCoordinates( node ) ) {
		debugger
		// get all other nodes with no connections
		const otherSingleNodes = nodes.filter( checkNode => checkNode.connectedTo.length === 0 && checkNode.id !== node.id && !isCollapsable( checkNode ) );
		const existingCoords = [];
		otherSingleNodes.forEach( nodeToCheck => {
			const { x, y } = nodeToCheck;
			if ( x !== undefined && y !== undefined ) {
				existingCoords.push( { x, y } );
			}
		} );

		let newCoords = {};
		// place above all other nodes that have connections? --> y = -400
		loop1:
			for ( let y = -400, i = 0; i <= otherSingleNodes.length; y -= minDistToEachOther, i++ ) {
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

const hasCoordinates = node => {
	const { x, y } = node;
	return x !== undefined && y !== undefined;
};