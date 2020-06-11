import { ACTIVE_ITEM, LAST_EDITOR_ACTION, LOG_MESSAGES } from './queries/LocalQueries';

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

export const setLastEditorAction = ( client, type, x, y ) => {
	client.writeQuery( {
		query: LAST_EDITOR_ACTION,
		data: {
			lastEditorAction: {
				type,
				position: {
					x,
					y,
				},
				__typename: 'LastEditorAction',
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

export const getDuplicates = ( list ) => {
	let newList = list.reduce( function( acc, el, i, arr ) {
		if ( arr.indexOf( el ) !== i && acc.indexOf( el ) < 0 ) {
			acc.push( el );
		}
		return acc;
	}, [] );
	return newList;
};
