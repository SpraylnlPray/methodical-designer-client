import React from 'react';
import CreateLink from './CreateLink';
import CreateNode from './CreateNode';
import EditNode from './EditNode';
import EditLink from './EditLink';
import GraphSettingsPane from './GraphSettingsPane';

const InputPane = ( { activeItem, client } ) => {

	const handleClick = ( e ) => {
		e.stopPropagation();
	};

	return (
		<div className='bordered margin-base' onClick={ e => handleClick( e ) }>
			{ activeItem.itemId === 'createnode' && activeItem.itemType === 'option' &&
			<CreateNode client={ client }/> }
			{ activeItem.itemId === 'createlink' && activeItem.itemType === 'option' &&
			<CreateLink client={ client }/> }
			{ activeItem.itemType === 'node' &&
			<EditNode
				client={ client }
				activeItem={ activeItem }
			/> }
			{ activeItem.itemType === 'link' &&
			<EditLink
				client={ client }
				activeItem={ activeItem }
			/> }
			{ activeItem.itemType === 'app' &&
			<GraphSettingsPane/> }
		</div>
	);
};

export default InputPane;