import {
	isCollapsable, rotateVector, toRad,
	coordsExist, getExistingCoordinatesFor, clamp, calcDistance, findParents, addVertex, normalizeCoords, assignChildren,
	convertToVisCoords
} from './NodeUtils';
import { addLogMessage, normalizeVector } from '../utils';

export const CollaspableRule = ( node, allCollapsables, client, limit, minDist = 1000 ) => {
	try {
		if ( isCollapsable( node ) ) {
			const otherCollapsables = allCollapsables.filter( aNode => aNode.id !== node.id && isCollapsable( aNode ) && !aNode.deleted );
			// get the coordinates of all other collapsables
			const existingCoords = getExistingCoordinatesFor( otherCollapsables );
			let newCoords = {};

			loop1:
				for ( let y = 0, i = 0; i <= limit; i++, y += minDist ) {
					for ( let x = 0, j = 0; j <= limit; j++, x += minDist ) {
						newCoords = { x, y };
						if ( !coordsExist( newCoords, existingCoords ) ) {
							node.position = newCoords;
							break loop1;
						}
					}
				}
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in CollapsableRuleNew: ' + e.message );
	}
}

export const NonCollapsableRule = ( _, nodes, client, minDistToEachOther = 500 ) => {
	try {
		// get nodes without coordinates
		const nodesWithoutCoords = nodes.filter( aNode => aNode.position === undefined );
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
						node.position = newCoords;
						node.level = 0;
						node.children = [];
						const toCheck = [];
						const checked = [];
						findParents( node, node, nodes, toCheck, checked, client );
						assignChildren( nodes );
						const next = [].concat( node.children );
						FlowerRule( next, client );
						for ( let node of nodes ) {
							convertToVisCoords( node );
						}
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

export const FlowerRule = ( next, client, distanceToOther = 350, minDist = 150 ) => {
	try {
		const nodeToCalculate = next.shift();
		if ( nodeToCalculate ) {
			for ( let parent of nodeToCalculate.parents ) {
				if ( parent.level === 0 ) {
					// domains themselves rarely have other connections other than to their part-of nodes, so we start placing them on the top left
					// and then go clockwise, placing one node each deltaAngle degrees
					const initVec = { x: -1, y: -1 };
					let normalized = normalizeVector( initVec );
					// all nodes connected to a collapsable, can be distributed 360° around it.
					// to get a uniform distribution we need to divide this angle by the amount of connected nodes
					let deltaAngle = 360 / parent.children.length;
					// if there are just 2 nodes, reduce the angle as a connection between them might cover up labels
					if ( parent.children.length === 2 ) {
						deltaAngle = deltaAngle * 2 / 3;
					}
					const deltaRad = toRad( deltaAngle );
					const index = parent.children.indexOf( nodeToCalculate );
					normalized = rotateVector( normalized, index * deltaRad );
					nodeToCalculate.dirVector = normalized;
					if ( !nodeToCalculate.position ) {
						nodeToCalculate.position = { x: 0, y: 0 };
					}
					const distance = calcDistance( nodeToCalculate );
					const newCoords = {
						x: parent.position.x + normalized.x * clamp( distance, minDist ),
						y: parent.position.y + normalized.y * clamp( distance, minDist ),
					};
					nodeToCalculate.position = addVertex( nodeToCalculate.position, newCoords );
				}
					// otherwise the parent node will have a dirVector property
					// nodes can be allocated +-90° around this direction vector
					// rotate the vector by -90°, get the amount of child nodes and divide 180° by this number
				// then rotate the vector once by the delta angle (in rad) / 2 and from here on place the first node each delta angle degrees
				else {
					const { dirVector } = parent;
					const zeroVec = rotateVector( dirVector, toRad( -90 ) );
					const deltaAngle = 180 / parent.children.length;
					const deltaRad = toRad( deltaAngle );
					const initVec = rotateVector( zeroVec, deltaRad / 2 );
					let normalized = normalizeVector( initVec );
					const index = parent.children.indexOf( nodeToCalculate );
					normalized = rotateVector( normalized, index * deltaRad );
					nodeToCalculate.dirVector = normalized;
					if ( !nodeToCalculate.position ) {
						nodeToCalculate.position = { x: 0, y: 0 };
					}
					const distance = calcDistance( nodeToCalculate );
					const newCoords = {
						x: parent.position.x + normalized.x * clamp( distance, minDist ),
						y: parent.position.y + normalized.y * clamp( distance, minDist ),
					};
					nodeToCalculate.position = addVertex( nodeToCalculate.position, newCoords );
					if ( !nodeToCalculate.dirVector ) {
						nodeToCalculate.dirVector = { x: 0, y: 0 };
					}
					nodeToCalculate.dirVector = addVertex( nodeToCalculate.dirVector, normalized );
				}
			}
			normalizeCoords( nodeToCalculate );

			for ( let childNode of nodeToCalculate?.children ) {
				if ( !next.includes( childNode ) ) {
					next.push( childNode );
				}
			}
			FlowerRule( next, client );
		}
	}
	catch ( e ) {
		addLogMessage( client, 'Error in FlowerRule2: ' + e.message );
	}
};
