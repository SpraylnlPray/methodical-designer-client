import React, { useState } from 'react';
import OptionBar from './OptionBar';
import InputPane from './InputPane';
import { ACTIVE_ITEM } from '../queries/LocalQueries';
import { useQuery } from '@apollo/client';
import { Button, Icon } from 'semantic-ui-react';

const InteractionPane = ( { client } ) => {
	const [ visible, setVisible ] = useState( true );
	const { data: { activeItem } } = useQuery( ACTIVE_ITEM );

	const handleUnhide = ( e ) => {
		e.stopPropagation();
		document.getElementById( 'editor-pane' ).classList.add( 'editor-pane' );
		document.getElementById( 'editor-pane' ).classList.remove( 'editor-pane-full' );
		setVisible( true );
	};

	if ( visible ) {
		return (
			<div className='bordered margin-base interaction-pane'>
				<OptionBar
					setVisible={ setVisible }
					activeItem={ activeItem }
				/>
				<InputPane
					client={ client }
					activeItem={ activeItem }
				/>
			</div>
		);
	}
	else {
		return (
			<div className='margin-base unhide-button'>
				<Button icon onClick={ handleUnhide }>
					<Icon name='unhide'/>
				</Button>
			</div>
		);
	}
};

export default InteractionPane;