import React from 'react';
import { Button } from 'semantic-ui-react';
import { setActiveItem } from '../utils';
import { useApolloClient } from '@apollo/client';

const OptionBar = props => {
	const client = useApolloClient();

	const handleClick = ( e ) => {
		e.stopPropagation();
		setActiveItem( client, e.target.value, 'option' );
	};

	return (
		<div className='bordered margin-base'>
			<Button value='createnode' onClick={ e => handleClick( e ) }>Create Node</Button>
			<Button value='createlink' onClick={ e => handleClick( e ) }>Create Link</Button>
		</div>
	);
};

export default OptionBar;