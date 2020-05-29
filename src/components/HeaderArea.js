import React from 'react';
import { Header } from 'semantic-ui-react';
import SavePane from './SavePane';
import ProjectStatus from './ProjectStatus';
import { useLazyQuery } from '@apollo/client';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from '../queries/ServerQueries';
import { NODES, LINKS } from '../queries/LocalQueries';
import { addLogMessage } from '../utils';

const HeaderArea = ( { client } ) => {

	const [ getNodes ] = useLazyQuery( GET_SERVER_NODES, {
		fetchPolicy: 'network-only',
		onError: error => addLogMessage( client, 'Error when pulling server nodes: ' + error ),
		onCompleted: data => {
			const localNodes = [];
			for ( let node of data.Nodes ) {
				const localNode = {
					...node,
					edited: false,
					created: false,
					deleted: false,
				};
				localNodes.push( localNode );
			}

			client.writeQuery( {
				query: NODES,
				data: { Nodes: localNodes },
			} );
		},
	} );
	const [ getLinks ] = useLazyQuery( GET_SERVER_LINKS, {
		fetchPolicy: 'network-only',
		onError: error => addLogMessage( client, 'Error when pulling server links: ' + error ),
		onCompleted: data => {
			const localLinks = [];
			for ( let link of data.Links ) {
				const localLink = {
					...link,
					edited: false,
					created: false,
					deleted: false,
				};
				localLinks.push( localLink );
			}
			client.writeQuery( {
				query: LINKS,
				data: { Links: localLinks },
			} );
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