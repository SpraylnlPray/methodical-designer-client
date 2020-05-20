import React from 'react';
import { Button } from 'semantic-ui-react';
import { addLogMessage, setActiveItem } from '../utils';
import { useApolloClient } from '@apollo/client';

const OptionBar = ( { activeItem } ) => {
	const client = useApolloClient();

	const handleClick = ( e ) => {
		e.stopPropagation();
		addLogMessage( client, `setting active item to ${ e.target.value }` );
		setActiveItem( client, e.target.value, 'option' );
	};

	return (
		<div className='bordered margin-base option-bar'>
			<Button
				className='option-button'
				active={ activeItem.itemId === 'createnode' }
				value='createnode'
				onClick={ e => handleClick( e ) }>
				Create Node
			</Button>
			<Button
				className='option-button'
				active={ activeItem.itemId === 'createlink' }
				value='createlink'
				onClick={ e => handleClick( e ) }>
				Create Link
			</Button>
		</div>
	);
};

export default OptionBar;