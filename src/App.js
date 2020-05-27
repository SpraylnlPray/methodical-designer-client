import React from 'react';
import InteractionPane from './components/InteractionPane';
import EditorPane from './components/EditorPane';
import HeaderArea from './components/HeaderArea';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { useApolloClient, useQuery } from '@apollo/client';
import LogStream from './components/LogStream';
import { deepCopy, setActiveItem } from './utils';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from './queries/ServerQueries';
import { NODES_DATA } from './queries/LocalQueries';

function App() {
	const client = useApolloClient();

	const handleClick = () => {
		setActiveItem( client, 'app', 'app' );
	};

	const { data: serverNodeData, startPolling: startNodePolling, stopPolling: stopNodePolling, refetch: nodeRefetch }
					= useQuery( GET_SERVER_NODES, {
		onCompleted: ( { Nodes } ) => {
			const nodesData = [];
			for ( let node of Nodes ) {
				let nodeCopy = deepCopy( node );
				const { id, label, type, story, synchronous, unreliable } = nodeCopy;
				let nodeData = {
					__typename: 'Node',
					id,
					label,
					type,
					story,
					synchronous,
					unreliable,
				};
				nodesData.push( nodeData );
			}
			client.writeQuery( {
				query: NODES_DATA,
				data: { Nodes: nodesData },
			} );
		},
		onError: error => console.log( error ),
	} );
	const { data: serverLinkData, startPolling: startLinkPolling, stopPolling: stopLinkPolling, refetch: linkRefetch }
					= useQuery( GET_SERVER_LINKS, {
		onError: error => console.log( error ),
	} );

	return (
		<div className='bordered app margin-base' onClick={ handleClick }>
			<HeaderArea client={ client } nodeRefetch={ nodeRefetch } linkRefetch={ linkRefetch }/>
			<Grid>
				<Grid.Row>
					<Grid.Column width={ 4 }>
						<InteractionPane client={ client }/>
					</Grid.Column>
					<Grid.Column width={ 12 }>
						<EditorPane serverNodeData={ serverNodeData } startNodePolling={ startNodePolling }
												stopNodePolling={ stopNodePolling }
												serverLinkData={ serverLinkData } startLinkPolling={ startLinkPolling }
												stopLinkPolling={ stopLinkPolling } client={ client }/>
					</Grid.Column>
				</Grid.Row>
			</Grid>
			<LogStream/>
			<div className='version'>
				v2
			</div>
		</div>
	);
}

export default App;
