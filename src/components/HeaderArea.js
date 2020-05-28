import React from 'react';
import { Header } from 'semantic-ui-react';
import SavePane from './SavePane';
import ProjectStatus from './ProjectStatus';

const HeaderArea = ( { client, nodeRefetch, linkRefetch } ) => {
	return (
		<div className='bordered margin-base header-area'>
			<Header className='main-header' as='h1'>Methodical Designer</Header>
			<ProjectStatus client={ client } linkRefetch={ linkRefetch } nodeRefetch={ nodeRefetch }/>
			<SavePane client={ client } linkRefetch={ linkRefetch } nodeRefetch={ nodeRefetch }/>
		</div>
	);
};

export default HeaderArea;