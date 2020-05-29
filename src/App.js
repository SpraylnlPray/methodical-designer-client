import React from 'react';
import InteractionPane from './components/InteractionPane';
import EditorPane from './components/EditorPane';
import HeaderArea from './components/HeaderArea';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { useApolloClient, useQuery } from '@apollo/client';
import LogStream from './components/LogStream';
import { addLogMessage, setActiveItem } from './utils';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from './queries/ServerQueries';
import ServerStartupMessage from './components/ServerStartupMessage';
import { LINKS, NODES } from './queries/LocalQueries';

function App() {
	const client = useApolloClient();

	const handleClick = () => {
		setActiveItem( client, 'app', 'app' );
	};

	const { data: serverNodeData, startPolling: startNodePolling, stopPolling: stopNodePolling }
					= useQuery( GET_SERVER_NODES, {
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
	const { data: serverLinkData, startPolling: startLinkPolling, stopPolling: stopLinkPolling }
					= useQuery( GET_SERVER_LINKS, {
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

	function EditorArea() {
		if ( serverNodeData && serverLinkData ) {
			stopNodePolling();
			stopLinkPolling();
			return (<EditorPane/>);
		}
		else {
			startNodePolling( 5000 );
			startLinkPolling( 5000 );

			return (<ServerStartupMessage/>);
		}
	}

	return (
		<div className='bordered app margin-base' onClick={ handleClick }>
			<HeaderArea client={ client }/>
			<Grid>
				<Grid.Row>
					<Grid.Column width={ 4 }>
						<InteractionPane client={ client }/>
					</Grid.Column>
					<Grid.Column width={ 12 }>
						{ EditorArea() }
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
