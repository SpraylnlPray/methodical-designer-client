export const saveSequence = ( client, link, promises, fnc ) => {
	const { group, seq } = link.sequence;
	const variables = { link_id: link.id, props: { group, seq: Number( seq ) } };
	promises.push( fnc( { variables } ) );
};

export const deleteSequence = ( client, link, promises, fnc ) => {
	const { id: link_id } = link;
	promises.push( fnc( { variables: { link_id } } ) );
};

export const saveLinkEnd = ( client, link, promises, end, fnc ) => {
	const { arrow, note } = link[end];
	const variables = {
		link_id: link.id,
		props: {
			arrow: arrow === '' ? 'none' : arrow,
			note,
			xy: end === 'x_end' ? 'x' : 'y',
		},
	};
	promises.push( fnc( { variables } ) );
};

export const deleteLinkEnd = ( client, link, promises, end, fnc ) => {
	const variables = { link_id: link.id, xy: end === 'x_end' ? 'x' : 'y' };
	promises.push( fnc( { variables } ) );
};

export const handleSequence = ( client, link, promises, saveFnc, deleteFnc ) => {
	if ( existsSequence( link ) ) {
		saveSequence( client, link, promises, saveFnc );
	}
	else {
		deleteSequence( client, link, promises, deleteFnc );
	}
};

export const handleLinkEnds = ( client, link, promises, saveFnc, deleteFnc ) => {
	if ( existsLinkEnd( link, 'x_end' ) ) {
		saveLinkEnd( client, link, promises, 'x_end', saveFnc );
	}
	else {
		deleteLinkEnd( client, link, promises, 'x_end', deleteFnc );
	}
	if ( existsLinkEnd( link, 'y_end' ) ) {
		saveLinkEnd( client, link, promises, 'y_end', saveFnc );
	}
	else {
		deleteLinkEnd( client, link, promises, 'y_end', deleteFnc );
	}
};

export const deleteLinkOrNode = ( client, entity, promises, deleteFnc ) => {
	const { id } = entity;
	promises.push( deleteFnc( { variables: { id } } ) );
};

export const existsSequence = ( link ) => link?.sequence?.group?.length > 0 || link?.sequence?.seq?.length > 0;

export const existsLinkEnd = ( link, end ) => link[end]?.arrow?.length > 0 || link[end]?.note?.length > 0;