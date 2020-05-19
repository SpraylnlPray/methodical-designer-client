import React from 'react';
import Graph from 'react-graph-vis';
import { setActiveItem } from '../utils';
import GraphManager from '../Graph/GraphManager';
import { useQuery } from '@apollo/client';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from '../queries/ServerQueries';
import { Message, Icon } from 'semantic-ui-react';

const EditorPane = ( { client, setMakeAppActive } ) => {

	const { data: nodeData, startPolling: startNodePolling, stopPolling: stopNodePolling } = useQuery( GET_SERVER_NODES, {
		onError: error => console.log( error ),
	} );
	const { data: linkData, startPolling: startLinkPolling, stopPolling: stopLinkPolling } = useQuery( GET_SERVER_LINKS, {
		onError: error => console.log( error ),
	} );

	if ( nodeData && linkData ) {
		stopNodePolling();
		stopLinkPolling();

		const theManager = new GraphManager( nodeData.Nodes, linkData.Links );
		let nodes = theManager.nodeDisplayData;
		let links = theManager.linkDisplayData;

		const graph = {
			nodes,
			edges: links,
		};
		const options = theManager.graphOptions;

		const events = {
			selectNode: function( event ) {
				let { nodes } = event;
				setMakeAppActive( false );
				setActiveItem( client, nodes[0], 'node' );
			},
			selectEdge: function( event ) {
				let { edges } = event;
				setMakeAppActive( false );
				setActiveItem( client, edges[0], 'link' );
			},
		};

		return (
			<div className='bordered editor-pane margin-base'>
				<Graph
					graph={ graph }
					options={ options }
					events={ events }
				/>
			</div>
		);
	}
	else {
		startNodePolling( 5000 );
		startLinkPolling( 5000 );

		return (
			<div className='bordered editor-pane margin-base flex-center'>
				<Message icon info floating className={ 'editor-loading-message' }>
					<Icon name='circle notched' loading/>
					<Message.Content>
						<Message.Header>The server is starting up...</Message.Header>
						This can take up to 30 seconds.
					</Message.Content>
				</Message>
			</div>
		);
	}
};

export default EditorPane;
