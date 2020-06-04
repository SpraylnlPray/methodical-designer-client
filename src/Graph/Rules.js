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
							if ( !CoordsExist( newCoords, existingCoords ) ) {
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

const CoordsExist = ( coord, coords ) => {
	for ( let coordsToCheck of coords ) {
		if ( coord.x === coordsToCheck.x && coord.y === coordsToCheck.y ) {
			return true;
		}
	}
	return false;
};

export const PartOfRule = ( node ) => {
	if ( hasPartOfLinks( node ) && !isCollapsable( node ) ) {
		// get container the node is connected to
		// get its position
		// place the node around the container
		debugger
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