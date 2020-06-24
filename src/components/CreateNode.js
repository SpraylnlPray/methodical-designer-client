import React, { useReducer } from 'react';
import '../css/NodeForm.css';
import { Form } from 'semantic-ui-react';
import Status from './Status';
import { inputReducer } from '../InputReducer';
import { useMutation, useQuery } from '@apollo/client';
import { CREATE_LOCAL_NODE } from '../queries/LocalMutations';
import { addLogMessage, enteredRequired } from '../utils';
import { typeOptions } from '../nodeOptions';
import { EDITING_RIGHTS } from '../queries/LocalQueries';
import Button from 'semantic-ui-react/dist/commonjs/elements/Button';

function CreateNode( { client } ) {
	const { data: editingData } = useQuery( EDITING_RIGHTS );
	const inputs = { required: { label: '', nodeType: '' }, props: { story: '', synchronous: false, unreliable: false } };

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs },
	);
	const [ runMutation, { data, loading, error } ] = useMutation( CREATE_LOCAL_NODE );

	const handleRequiredChange = ( e, data ) => {
		const name = data.name;
		const value = data.type === 'checkbox' ? data.checked : data.value;
		dispatch( { type: 'ADD_REQUIRED', name, value } );
	};

	const handlePropsChange = ( e, data ) => {
		const name = data.name;
		const value = data.type === 'checkbox' ? data.checked : data.value;
		dispatch( { type: 'ADD_PROPS', name, value } );
	};

	const handleSubmit = ( e ) => {
		e.preventDefault();
		if ( enteredRequired( store.required ) ) {
			addLogMessage( client, `creating node` );
			runMutation( {
				variables: {
					...store.required,
					props: store.props,
				},
			} )
				.catch( e => addLogMessage( client, 'Failed when creating node: ' + e.message ) );
		}
		else {
			alert( 'Must provide required inputs!' );
		}
	};

	return (
		<div className='node-form'>
			<Form className='node-form-grid'>
				<Form.Input
					fluid
					className='node-label'
					label='Label'
					placeholder='Label'
					onChange={ handleRequiredChange }
					required
					name='label'
					value={ store.required['label'] }
				/>
				<Form.Dropdown
					className='node-type'
					fluid
					clearable
					floating
					search
					selection
					label='Type'
					options={ typeOptions }
					placeholder='Type'
					onChange={ handleRequiredChange }
					required
					name='nodeType'
					value={ store.required['nodeType'] }
				/>
				<Form.Input
					fluid
					className='node-story'
					label='Story'
					placeholder='Story'
					onChange={ handlePropsChange }
					name='story'
					value={ store.props['story'] }
				/>
				<Form.Checkbox
					className='node-synchronous'
					label='Synchronous'
					onChange={ handlePropsChange }
					checked={ store.props['synchronous'] }
					name='synchronous'
				/>
				<Form.Checkbox
					className='node-unreliable'
					label='Unreliable'
					onChange={ handlePropsChange }
					checked={ store.props['unreliable'] }
					name='unreliable'
				/>
			</Form>
			<Button className='save-button' color='green' disabled={ !editingData.hasEditRights } onClick={ handleSubmit }>Save!</Button>
			<Status data={ data } error={ error } loading={ loading }/>
		</div>
	);
}

export default CreateNode;
