import React from 'react';
import { Header } from 'semantic-ui-react';
import SavePane from './SavePane';
import ProjectStatus from './ProjectStatus';
import { useLazyQuery } from '@apollo/client';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from '../queries/ServerQueries';

const HeaderArea = ( { client } ) => {

	const [ getNodes ] = useLazyQuery( GET_SERVER_NODES, {
		fetchPolicy: 'network-only',
	} );
	const [ getLinks ] = useLazyQuery( GET_SERVER_LINKS, {
		fetchPolicy: 'network-only',
	} );

	return (
		<div className='bordered margin-base header-area'>
			<Header className='main-header' as='h1'>Methodical Designer</Header>
			<ProjectStatus client={ client } getNodes={ getNodes } getLinks={ getLinks } />
			<SavePane client={ client } getNodes={ getNodes } getLinks={ getLinks } />
		</div>
	);
};

export default HeaderArea;