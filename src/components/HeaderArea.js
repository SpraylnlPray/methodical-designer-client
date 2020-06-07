import React from 'react';
import { Header } from 'semantic-ui-react';
import SavePane from './SavePane';
import ProjectStatus from './ProjectStatus';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from '../queries/ServerQueries';
import { addLogMessage } from '../utils';
import { SET_LINKS, SET_NODES } from '../queries/LocalMutations';

const HeaderArea = ( { client } ) => {

	const [ setNodes ] = useMutation( SET_NODES );
	const [ setLinks ] = useMutation( SET_LINKS );

	const [ getNodes ] = useLazyQuery( GET_SERVER_NODES, {
		fetchPolicy: 'network-only',
		onError: error => addLogMessage( client, 'Error when pulling server nodes: ' + error ),
		onCompleted: data => {
			setNodes( { variables: { nodes: data.Nodes } } )
				.catch( err => addLogMessage( client, 'error when setting local nodes from header area: ' + err.message ) );
		},
	} );
	const [ getLinks ] = useLazyQuery( GET_SERVER_LINKS, {
		fetchPolicy: 'network-only',
		onError: error => addLogMessage( client, 'Error when pulling server links: ' + error ),
		onCompleted: data => {
			setLinks( { variables: { links: data.Links } } )
				.catch( err => addLogMessage( client, 'error when setting local links from header area: ' + err.message ) );
		},
	} );

	return (
		<div className='bordered margin-base header-area'>
			<Header className='main-header' as='h1'>Methodical Designer</Header>
			<ProjectStatus client={ client } getNodes={ getNodes } getLinks={ getLinks }/>
			<SavePane client={ client } getNodes={ getNodes } getLinks={ getLinks }/>
		</div>
	);
};

export default HeaderArea;