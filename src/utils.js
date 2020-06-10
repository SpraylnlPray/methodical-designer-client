import { ACTIVE_ITEM, LOG_MESSAGES } from './queries/LocalQueries';
import { NodeImages } from './Graph/Images';
import { ArrowShapes, NodeShapes } from './Graph/Shapes';
import { LinkColors, NodeColors } from './Graph/Colors';

export const setActiveItem = ( client, itemId, itemType ) => {
	client.writeQuery( {
		query: ACTIVE_ITEM,
		data: {
			activeItem: {
				itemId,
				itemType,
				__typename: 'ActiveItem',
			},
		},
	} );
};

export const addLogMessage = ( client, msg ) => {
	const { logMessages } = client.readQuery( { query: LOG_MESSAGES } );
	const newMessages = [ ...logMessages, msg ];
	client.writeQuery( {
		query: LOG_MESSAGES,
		data: {
			logMessages: newMessages,
		},
	} );
};

// check if the user entered a value for the required fields
export const enteredRequired = ( requiredFields ) => {
	for ( let key of Object.keys( requiredFields ) ) {
		if ( requiredFields[key].length <= 0 ) {
			return false;
		}
	}
	return true;
};

export const generateLocalUUID = () => {
	return ([ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11).replace( /[018]/g, c =>
		// eslint-disable-next-line
		(c ^ crypto.getRandomValues( new Uint8Array( 1 ) )[0] & 15 >> c / 4).toString( 16 ) );
};

export const deepCopy = obj => JSON.parse( JSON.stringify( obj ) );

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

export const VecDist = ( p1, p2 ) => {
	const deltaX = p1.x - p2.x;
	const deltaY = p1.y - p2.y;
	return Math.hypot( deltaX, deltaY );
};

export const setMultipleLinksProps = ( links, multipleConnIDs ) => {
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
};

export const connectsNodes = ( node1ID, node2ID, link ) => {
	// eslint-disable-next-line
	return link.x.id === node1ID && link.y.id === node2ID ||
		// eslint-disable-next-line
		link.y.id === node1ID && link.x.id === node2ID;
};

export const getDuplicates = ( list ) => {
	let newList = list.reduce( function( acc, el, i, arr ) {
		if ( arr.indexOf( el ) !== i && acc.indexOf( el ) < 0 ) {
			acc.push( el );
		}
		return acc;
	}, [] );
	return newList;
};

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