import React from 'react';
import { Message } from 'semantic-ui-react';

const LoadingMessage = ( { message } ) => {
	return (
		<Message
			className='loading-message'
			size='tiny'
			header='Saving...'
			content={ message }
		/>
	);
};

export default LoadingMessage;
