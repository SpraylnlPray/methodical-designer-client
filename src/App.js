import React from 'react';
import InteractionPane from './components/InteractionPane';
import EditorPane from './components/EditorPane';
import HeaderArea from './components/HeaderArea';
import { Grid } from 'semantic-ui-react';
import './App.css';
import { useApolloClient } from '@apollo/client';

function App() {
	const client = useApolloClient();

	return (
		<div className='bordered app margin-base'>
			<HeaderArea client={ client }/>
			<Grid>
				<Grid.Row>
					<Grid.Column width={ 4 }>
						<InteractionPane client={ client } />
					</Grid.Column>
					<Grid.Column width={ 12 }>
						<EditorPane client={ client } />
					</Grid.Column>
				</Grid.Row>
			</Grid>
		</div>
	);
}

export default App;
