import React, { useState } from 'react';
import InteractionPane from './components/InteractionPane';
import EditorPane from './components/EditorPane';
import HeaderArea from './components/HeaderArea';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { setActiveItem } from './utils';
import { useApolloClient } from '@apollo/client';

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

	return (
		<div className='bordered app margin-base' onClick={ handleClick }>
			<HeaderArea client={ client }/>
			<Grid>
				<Grid.Row>
					<Grid.Column width={ 4 }>
						<InteractionPane
							client={ client }
						/>
					</Grid.Column>
					<Grid.Column width={ 12 }>
						<EditorPane
							setMakeAppActive={ setMakeAppActive }
							client={ client }
						/>
					</Grid.Column>
				</Grid.Row>
			</Grid>
		</div>
	);
}

export default App;
