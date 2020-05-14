import React, { useState } from 'react';
import InteractionPane from './components/InteractionPane';
import EditorPane from './components/EditorPane';
import HeaderArea from './components/HeaderArea';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { setActiveItem } from './utils';
import { GET_SERVER_LINKS, GET_SERVER_NODES } from './queries/ServerQueries';
import { useApolloClient, useQuery } from '@apollo/client';

function App() {
	const id = 'app';
	const client = useApolloClient();
	let [ makeAppActive, setMakeAppActive ] = useState( true );

	const handleClick = ( e ) => {
		// this is for the editor. the editor can set this property to false as stopping the propagation of the vis
		// event does not seem to be possible.
		if ( makeAppActive ) {
			setActiveItem( client, id, 'app' );
		}
		setMakeAppActive( true );
	};

	const { data: nodeData, refetch: nodeRefetch } = useQuery( GET_SERVER_NODES, {
		onError: error => console.log( error ),
	} );
	const { data: linkData, refetch: linkRefetch } = useQuery( GET_SERVER_LINKS, {
		onError: error => console.log( error ),
	} );

	return (
		<div className='bordered app margin-base' onClick={ handleClick }>
			<HeaderArea client={ client }/>
			<Grid>
				<Grid.Row>
					<Grid.Column width={ 4 }>
						<InteractionPane
							linkRefetch={ linkRefetch }
							nodeRefetch={ nodeRefetch }
							client={ client }
						/>
					</Grid.Column>
					<Grid.Column width={ 12 }>
						{ nodeData && linkData && (
							<EditorPane
								setMakeAppActive={ setMakeAppActive }
								client={ client }
								nodeData={ nodeData }
								linkData={ linkData }
							/>
						) }
					</Grid.Column>
				</Grid.Row>
			</Grid>
		</div>
	);
}

export default App;
