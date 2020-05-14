import React from 'react';
import OptionBar from './OptionBar';
import InputPane from './InputPane';
import { ACTIVE_ITEM } from '../queries/LocalQueries';
import { useQuery } from '@apollo/client';

const InteractionPane = ( { client, nodeRefetch, linkRefetch } ) => {
	const { data: { activeItem } } = useQuery( ACTIVE_ITEM );
	return (
		<div className='bordered interaction-pane margin-base'>
			<div>{ activeItem.itemId }</div>
			<OptionBar/>
			<InputPane
				client={ client }
				linkRefetch={ linkRefetch }
				nodeRefetch={ nodeRefetch }
				activeItem={ activeItem }/>
		</div>
	);
};

export default InteractionPane;