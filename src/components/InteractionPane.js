import React from 'react';
import OptionBar from './OptionBar';
import InputPane from './InputPane';
import { ACTIVE_ITEM } from '../queries/LocalQueries';
import { useQuery } from '@apollo/client';

const InteractionPane = ( { client } ) => {
	const { data: { activeItem } } = useQuery( ACTIVE_ITEM );
	return (
		<div className='bordered interaction-pane margin-base'>
			<div>{ activeItem.itemId }</div>
			<OptionBar
				activeItem={ activeItem }
			/>
			<InputPane
				client={ client }
				activeItem={ activeItem }
			/>
		</div>
	);
};

export default InteractionPane;