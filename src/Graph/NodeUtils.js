import { NodeImages } from './Images';
import { NodeShapes } from './Shapes';
import { NodeColors } from './Colors';

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