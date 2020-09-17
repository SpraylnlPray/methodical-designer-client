import { ACTIVE_ITEM, CAMERA_POS, LOG_MESSAGES } from './queries/LocalQueries';
import Fuse from 'fuse.js';

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

	document.getElementById( 'log-header' )
		.classList.add( 'blinking-blue' );
};

// check if the user entered a value for the required fields
export const enteredRequired = ( requiredFields ) => {
	for ( let key of Object.keys( requiredFields ) ) {
		if ( requiredFields[ key ].length <= 0 ) {
			return false;
		}
	}
	return true;
};

export const generateLocalUUID = () => {
	return ( [ 1e7 ] + -1e3 + -4e3 + -8e3 + -1e11 ).replace( /[018]/g, c =>
		// eslint-disable-next-line
		( c ^ crypto.getRandomValues( new Uint8Array( 1 ) )[ 0 ] & 15 >> c / 4 ).toString( 16 ) );
};

export const deepCopy = obj => JSON.parse( JSON.stringify( obj ) );

export const getDuplicates = ( list ) => {
	let newList = list.reduce( function ( acc, el, i, arr ) {
		if ( arr.indexOf( el ) !== i && acc.indexOf( el ) < 0 ) {
			acc.push( el );
		}
		return acc;
	}, [] );
	return newList;
};

export const normalizeVector = ( vec ) => {
	const magnitude = vectorMagnitude( vec );
	return { x: vec.x / magnitude, y: vec.y / magnitude };
};

export const vectorMagnitude = ( vec ) => {
	return Math.sqrt( vec.x * vec.x + vec.y * vec.y );
};

const options = { keys: [ 'label' ], findAllMatches: true, includeScore: true };
export const getMatchingIDs = ( nodesCopy, searchString ) => {
	const fuse = new Fuse( nodesCopy, options );
	const results = fuse.search( searchString );
	const goodResults = results.filter( aResult => aResult.score < 0.4 );
	const foundIDs = goodResults.map( aResult => aResult.item.id );
	return foundIDs;
};

export const setCameraPos = ( cache, camData ) => {
	cache.writeQuery( {
		query: CAMERA_POS,
		data: { setCameraPos: camData },
	} );
};

export const writeNodesToCache = ( client, cache, query, data, fnctName ) => {
	try {
		cache.writeQuery( { query, data } );
	}
	catch ( e ) {
		addLogMessage( client, 'Error when writing nodes to cache in ' + fnctName + ': ' + e.message );
	}
};

export const writeLinksToCache = ( client, cache, query, data, fnctName ) => {
	try {
		cache.writeQuery( { query, data } );
	}
	catch ( e ) {
		addLogMessage( client, 'Error when writing links to cache in ' + fnctName + ': ' + e.message );
	}
}

export const writeToCache = ( client, cache, query, data, errorMsg ) => {
	try {
		cache.writeQuery( { query, data } );
	}
	catch ( e ) {
		addLogMessage( client, errorMsg + ': ' + e.message );
	}
};

export const readNodesFromCache = ( client, cache, query, fnctName ) => {
	try {
		return cache.readQuery( { query } );
	}
	catch ( e ) {
		addLogMessage( client, 'Error when reading nodes from cache in ' + fnctName + ': ' + e.message );
	}
};

export const readLinksFromCache = ( client, cache, query, fnctName ) => {
	try {
		return cache.readQuery( { query } );
	}
	catch ( e ) {
		addLogMessage( client, 'Error when reading links from cache in ' + fnctName + ': ' + e.message );
	}
}

export const readFromCache = ( client, cache, query, errorMsg ) => {
	try {
		return cache.readQuery( { query } );
	}
	catch ( e ) {
		addLogMessage( client, errorMsg + ': ' + e.message );
	}
};
