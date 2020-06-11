import { areBothHidden, isHidden } from './NodeUtils';
import { LinkColors } from './Colors';
import { ArrowShapes } from './Shapes';
import { deepCopy } from '../utils';

export const modifyConnectedLink = ( link, nodeID ) => {
	const isCircle = link.x.id === link.y.id;
	// if the link is a circle on the node, delete it
	if ( isCircle ) {
		link.deleted = true;
	}
	// if the x node has been deleted, set the x id equal to the y id
	else if ( link.x.id === nodeID ) {
		link.x.id = link.y.id;
		// for displaying
		link.from = link.y.id;
	}
	// and vice versa
	else if ( link.y.id === nodeID ) {
		link.y.id = link.x.id;
		link.to = link.x.id;
	}
};

export const snap = ( link, nodesCopy ) => {
	const x_node = nodesCopy.find( node => node.id === link.x.id );
	const y_node = nodesCopy.find( node => node.id === link.y.id );
	// snapping should only happen if one of them is still visible
	if ( x_node && y_node && !areBothHidden( x_node, y_node ) && link.type !== 'PartOf' ) {
		setXConnection( x_node, link );
		setYConnection( y_node, link );
	}
};

export const setYConnection = ( node, link ) => {
	if ( node.changedVisibility ) {
		// if the node is hidden, set the links property to the hiddenBy value from the node
		if ( isHidden( node ) ) {
			link.to = node.hiddenBy;
		}
		else {
			link.to = link.y.id;
		}
	}
};

export const setXConnection = ( node, link ) => {
	if ( node.changedVisibility ) {
		// if the node is hidden, set the links property to the hiddenBy value from the node
		if ( isHidden( node ) ) {
			link.from = node.hiddenBy;
		}
		else {
			link.from = link.x.id;
		}
	}
};

export const findAndHandleMultipleLinks = ( link, linksCopy ) => {
	const multipleLinksIDs = [ link.id ];
	// get the x and y node id of the link
	const x_id = link.x.id;
	const y_id = link.y.id;
	// get all other links
	const otherLinks = linksCopy.filter( aLink => aLink.id !== link.id && !aLink.checked );
	// check if any of the other links connects the same nodes
	for ( let checkLink of otherLinks ) {
		// if it connects the same nodes
		if ( connectsNodes( x_id, y_id, checkLink ) ) {
			// save it to the list
			multipleLinksIDs.push( checkLink.id );
		}
	}
	setMultipleLinksProps( linksCopy, multipleLinksIDs );
};

export const setLinkDisplayProps = ( link, x_end, y_end ) => {
	// x is from, y is to!
	if ( LinkColors[link.type] ) {
		link.color = LinkColors[link.type];
	}
	else {
		link.color = LinkColors.Default;
	}

	if ( link?.sequence ) {
		const { group, seq } = link.sequence;
		if ( group?.length > 0 || seq?.length > 0 ) {
			link.label = `${ group } - ${ seq }`;
		}
	}

	link.arrows = {};
	if ( x_end?.arrow?.length > 0 ) {
		link.arrows.from = {
			enabled: true,
			type: ArrowShapes[x_end.arrow],
		};
	}
	if ( y_end?.arrow?.length > 0 ) {
		link.arrows.to = {
			enabled: true,
			scaleFactor: 1,
			type: ArrowShapes[y_end.arrow],
		};
	}
};

export const connectsNodes = ( node1ID, node2ID, link ) => {
	// eslint-disable-next-line
	return link.x.id === node1ID && link.y.id === node2ID ||
		// eslint-disable-next-line
		link.y.id === node1ID && link.x.id === node2ID;
};

export const setMultipleLinksProps = ( links, multipleConnIDs ) => {
	if ( multipleConnIDs.length > 1 ) {
		links.map( link => {
			if ( multipleConnIDs.includes( link.id ) ) {
				const index = multipleConnIDs.indexOf( link.id );
				link.found = true;
				link.checked = true;
				link.from = link.x.id;
				link.to = link.y.id;
				link.smooth = {
					enabled: index !== 0,
					type: 'horizontal',
					roundness: index / multipleConnIDs.length,
				};
			}
			return link;
		} );
	}
};

export const updateLink = ( variables, linkToEdit ) => {
	let { id, props, seq: sequence, x_end, y_end } = variables;
	const { label, type, x_id, y_id, optional, story } = props;
	const x = { id: x_id };
	const y = { id: y_id };
	props = { label, type, optional, story, x, y, sequence, x_end, y_end };

	// let linkToEdit = Links.find( link => link.id === id );
	linkToEdit = deepCopy( linkToEdit );
	// first save the name (--> permanent label) on the link
	linkToEdit.name = label;
	// then update all props (including sequence)
	for ( let prop in props ) {
		linkToEdit[prop] = props[prop];
	}
	// if there's a sequence property, set the label in here
	setLinkDisplayProps( linkToEdit, x_end, y_end );
	linkToEdit.edited = true;
	linkToEdit.from = x_id;
	linkToEdit.to = y_id;
	linkToEdit.__typename = 'Link';
	return linkToEdit;
};