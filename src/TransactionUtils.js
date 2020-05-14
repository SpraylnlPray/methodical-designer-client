export const saveSequence = ( link, promises, fnc ) => {
	console.log( 'saving sequence ', link.sequence, ' on link ', link );
	const { group, seq } = link.sequence;
	const variables = { link_id: link.id, props: { group, seq: Number( seq ) } };
	promises.push( fnc( { variables } ) );
};

export const deleteSequence = ( link, promises, fnc ) => {
	console.log( 'deleting sequence ', link.sequence, ' on link ', link );
	const { id: link_id } = link;
	promises.push( fnc( { variables: { link_id } } ) );
};

export const saveLinkEnd = ( link, promises, end, fnc ) => {
	console.log( 'saving link end ', link[end], ' on link ', link );
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

export const deleteLinkEnd = ( link, promises, end, fnc ) => {
	console.log( 'deleting link end ', link[end], ' on link ', link );
	const variables = { link_id: link.id, xy: end === 'x_end' ? 'x' : 'y' };
	promises.push( fnc( { variables } ) );
};

export const handleSequence = ( link, promises, saveFnc, deleteFnc ) => {
	if ( existsSequence( link ) ) {
		saveSequence( link, promises, saveFnc );
	}
	else {
		deleteSequence( link, promises, deleteFnc );
	}
};

export const handleLinkEnds = ( link, promises, saveFnc, deleteFnc ) => {
	if ( existsLinkEnd( link, 'x_end' ) ) {
		saveLinkEnd( link, promises, 'x_end', saveFnc );
	}
	else {
		deleteLinkEnd( link, promises, 'x_end', deleteFnc );
	}
	if ( existsLinkEnd( link, 'y_end' ) ) {
		saveLinkEnd( link, promises, 'y_end', saveFnc );
	}
	else {
		deleteLinkEnd( link, promises, 'y_end', deleteFnc );
	}
};

export const deleteLinkOrNode = ( entity, promises, deleteFnc ) => {
	console.log( 'deleting ', entity );
	const { id } = entity;
	promises.push( deleteFnc( { variables: { id } } ) );
};

export const existsSequence = ( link ) => link?.sequence?.group?.length > 0 || link?.sequence?.seq?.length > 0;

export const existsLinkEnd = ( link, end ) => link[end]?.arrow?.length > 0 || link[end]?.note?.length > 0;