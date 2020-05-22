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

function App() {
	const client = useApolloClient();

	const handleClick = () => {
		addLogMessage( client, `setting active item to app` );
		setActiveItem( client, 'app', 'app' );
	};

	const { data: serverNodeData, startPolling: startNodePolling, stopPolling: stopNodePolling, refetch: nodeRefetch }
					= useQuery( GET_SERVER_NODES, {
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
