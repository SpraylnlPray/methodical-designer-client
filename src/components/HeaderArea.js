import React from 'react';
import { Header } from 'semantic-ui-react';
import SavePane from './SavePane';

const HeaderArea = ( { client } ) => {
	return (
		<div className='bordered margin-base header-area'>
			<Header className='main-header' as='h1'>Methodical Designer</Header>
			<SavePane client={ client }/>
		</div>
	);
};

export default HeaderArea;