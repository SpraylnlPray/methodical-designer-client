import React from 'react';
import { Button, Icon } from 'semantic-ui-react';
import { setActiveItem } from '../utils';
import { useApolloClient } from '@apollo/client';

const OptionBar = ( { activeItem, setVisible } ) => {
	const client = useApolloClient();

	const handleClick = ( e ) => {
		e.stopPropagation();
		setActiveItem( client, e.target.value, 'option' );
	};

	const handleHide = ( e ) => {
		e.stopPropagation();
		document.getElementById( 'editor-pane' )
			.classList.remove( 'editor-pane' );
		document.getElementById( 'editor-pane' )
			.classList.add( 'editor-pane-full' );
		setVisible( false );
	};

	return (
		<div className='margin-base option-bar'>
			<Button
				toggle
				color='teal'
				className='option-button'
				active={ activeItem.itemId === 'createnode' }
				value='createnode'
				onClick={ e => handleClick( e ) }>
				Create Node
			</Button>
			<Button
				toggle
				color='teal'
				className='option-button'
				active={ activeItem.itemId === 'createlink' }
				value='createlink'
				onClick={ e => handleClick( e ) }>
				Create Link
			</Button>
			<Button icon onClick={ handleHide }>
				<Icon name='hide'/>
			</Button>
		</div>
	);
};

export default OptionBar;