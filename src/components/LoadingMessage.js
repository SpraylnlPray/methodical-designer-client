import React from 'react';
import { Message } from 'semantic-ui-react';

const LoadingMessage = ( { message } ) => {
	return (
		<Message
			size='tiny'
			icon='save'
			header='Loading...'
			content={ message }
		/>
	);
};

export default LoadingMessage;
