import React from 'react';
import Graph from 'react-graph-vis';
import { addLogMessage, setActiveItem } from '../utils';
import GraphManager from '../Graph/GraphManager';
import { useQuery } from '@apollo/client';
import { Message, Icon } from 'semantic-ui-react';
import { LOCAL_LINKS_TAGS, LOCAL_NODES_TAGS } from '../queries/LocalQueries';

const EditorPane = ( { client, serverNodeData, startNodePolling, stopNodePolling, serverLinkData, startLinkPolling, stopLinkPolling } ) => {
	const { data: nodeData, refetch: nodeRefetch } = useQuery( LOCAL_NODES_TAGS, {
		onError: error => addLogMessage( client, `Failed when getting local nodes: ${ error }` ),
	} );
	const { data: linkData, refetch: linkRefetch } = useQuery( LOCAL_LINKS_TAGS, {
		onError: error => addLogMessage( client, `Failed when getting local links: ${ error }` ),
	} );

	if ( serverNodeData && serverLinkData && nodeData && linkData ) {
		stopNodePolling();
		stopLinkPolling();
		// nodeRefetch();
		// linkRefetch();

		const theManager = new GraphManager( nodeData.Nodes, linkData.Links );
		let nodes = theManager.nodeDisplayData;
		let links = theManager.linkDisplayData;

		const graph = {
			nodes,
			edges: links,
		};
		const options = theManager.graphOptions;

		const events = {
			select: function( event ) {
				const { nodes, edges } = event;
				if ( nodes.length > 0 ) {
					setActiveItem( client, nodes[0], 'node' );
				}
				else if ( edges.length > 0 ) {
					setActiveItem( client, edges[0], 'link' );
				}
			},
			dragStart: function( event ) {
				const { nodes } = event;
				setActiveItem( client, nodes[0], 'node' );
			},
			click: function( event ) {
				const { nodes, edges } = event;
				if ( nodes.length === 0 && edges.length === 0 ) {
					setActiveItem( client, 'app', 'app' );
				}
			},
		};

		// stopping events in the events object above is not possible
		// so we handle the logic there, and stop the propagation here before it can get to the app level
		function handleClick( e ) {
			e.stopPropagation();
		}

		return (
			<div className='bordered editor-pane margin-base' onClick={ handleClick }>
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
