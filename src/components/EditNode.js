import React, { useEffect, useReducer } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { EDITING_RIGHTS, LOCAL_NODES_TAGS } from '../queries/LocalQueries';
import { Container, Form } from 'semantic-ui-react';
import Status from './Status';
import { addLogMessage, enteredRequired, setActiveItem } from '../utils';
import { inputReducer } from '../InputReducer';
import { DELETE_LOCAL_NODE, UPDATE_LOCAL_NODE } from '../queries/LocalMutations';
import { typeOptions } from '../nodeOptions';

const EditNode = ( { activeItem, client } ) => {
	const { data: editingData } = useQuery( EDITING_RIGHTS );
	const { data: { Nodes } } = useQuery( LOCAL_NODES_TAGS );
	const node = Nodes.find( node => node.id === activeItem.itemId );
	const { label, type, story, synchronous, unreliable } = node;
	const inputs = { required: { label, type }, props: { story, synchronous, unreliable } };
	if ( node.type === 'Container' || node.type === 'Domain' ) {
		inputs.props.collapse = !!node.collapse;
	}

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs },
	);

	useEffect( () => {
		dispatch( { type: 'UPDATE', data: inputs } );
		// eslint-disable-next-line
	}, [ activeItem ] );

	const [ runUpdate, { data: updateData, loading: updateLoading, error: updateError } ] = useMutation( UPDATE_LOCAL_NODE );
	const [ runDelete ] = useMutation( DELETE_LOCAL_NODE );

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
		e.stopPropagation();
		if ( enteredRequired( store.required ) ) {
			// in this query all entries are optional as they can be edited or not
			// at some point I'll have to refactor this on the server side
			let props = { ...store.props, ...store.required };
			let variables = { id: activeItem.itemId, props };
			runUpdate( { variables } )
				.catch( e => addLogMessage( client, `Failed when editing node: ${ e }` ) );
		}
		else {
			alert( 'Must provide required inputs!' );
		}
	};

	const handleDelete = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		runDelete( { variables: { id: activeItem.itemId } } )
			.catch( e => addLogMessage( client, `Failed when deleting node: ${ e }` ) );
		setActiveItem( client, 'app', 'app' );
	};

	return (
		<Container>
			<Form className='create-form'>
				<Form.Group className='create-group'>
					<Form.Input
						fluid
						className='create-required-input create-input'
						label='Label'
						placeholder='Label'
						onChange={ handleRequiredChange }
						required
						name='label'
						value={ store.required['label'] }
					/>
					<Form.Select
						className='create-required-select create-input'
						fluid
						label='Type'
						options={ typeOptions }
						placeholder='Type'
						onChange={ handleRequiredChange }
						required
						name='type'
						value={ store.required['type'] }
					/>
					<Form.Input
						fluid
						className='create-required-input create-input'
						label='Story'
						placeholder='Story'
						onChange={ handlePropsChange }
						name='story'
						value={ store.props['story'] }
					/>
					<Form.Checkbox
						className='create-input'
						label='Synchronous'
						onChange={ handlePropsChange }
						checked={ store.props['synchronous'] }
						name='synchronous'
					/>
					<Form.Checkbox
						className='create-input'
						label='Unreliable'
						onChange={ handlePropsChange }
						checked={ store.props['unreliable'] }
						name='unreliable'
					/>
					{ (node.type === 'Container' || node.type === 'Domain') &&
					<Form.Checkbox
						className='create-input'
						label='Collapse'
						onChange={ handlePropsChange }
						checked={ store.props['collapse'] }
						name='collapse'
					/>
					}
				</Form.Group>
				<Form.Button disabled={ !editingData.hasEditRights } onClick={ handleSubmit }>Save!</Form.Button>
				<Form.Button disabled={ !editingData.hasEditRights } onClick={ handleDelete }>Delete</Form.Button>
			</Form>
			<Status data={ updateData } error={ updateError } loading={ updateLoading }/>
		</Container>
	);
};

export default EditNode;