import React from 'react';
import { Header } from 'semantic-ui-react';
import SavePane from './SavePane';
import ProjectStatus from './ProjectStatus';
import { useLazyQuery, useMutation } from '@apollo/client';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from '../queries/ServerQueries';
import { NODES_KOORDS } from '../queries/LocalQueries';
import { addLogMessage } from '../utils';
import { SET_LINKS, SET_NODES } from '../queries/LocalMutations';

const HeaderArea = ( { client } ) => {

	const [ setNodes ] = useMutation( SET_NODES );
	const [ setLinks ] = useMutation( SET_LINKS );

	const [ getNodes ] = useLazyQuery( GET_SERVER_NODES, {
		fetchPolicy: 'network-only',
		onError: error => addLogMessage( client, 'Error when pulling server nodes: ' + error ),
		onCompleted: data => {
			const currLocalNodes = client.readQuery( { query: NODES_KOORDS } );
			const newLocalNodes = [];
			for ( let node of data.Nodes ) {
				const currLocalNode = currLocalNodes.Nodes.find( curr => node.id === curr.id );
				const { x, y } = currLocalNode;
				const newLocalNode = {
					...node,
					x,
					y,
					edited: false,
					created: false,
					deleted: false,
				};
				newLocalNodes.push( newLocalNode );
			}

			setNodes( { variables: { nodes: newLocalNodes } } );
		},
	} );
	const [ getLinks ] = useLazyQuery( GET_SERVER_LINKS, {
		fetchPolicy: 'network-only',
		onError: error => addLogMessage( client, 'Error when pulling server links: ' + error ),
		onCompleted: data => {
			const newLocalLinks = [];
			for ( let link of data.Links ) {
				const localLink = {
					...link,
					edited: false,
					created: false,
					deleted: false,
				};
				newLocalLinks.push( localLink );
			}
			setLinks( { variables: { links: newLocalLinks } } );
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