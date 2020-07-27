import React, { useEffect, useReducer } from 'react';
import '../css/NodeForm.css';
import { useMutation, useQuery } from '@apollo/client';
import { EDITING_RIGHTS, NODES_WITH_TAGS } from '../queries/LocalQueries';
import { Form, Button } from 'semantic-ui-react';
import Status from './Status';
import { addLogMessage, enteredRequired, setActiveItem } from '../utils';
import { inputReducer } from '../InputReducer';
import { COLLAPSE_NODE, DELETE_LOCAL_NODE, UPDATE_LOCAL_NODE } from '../queries/LocalMutations';
import { typeOptions } from '../nodeOptions';

const EditNode = ( { activeItem, client } ) => {
	const { data: editingData } = useQuery( EDITING_RIGHTS );
	const { data: { Nodes } } = useQuery( NODES_WITH_TAGS );
	const node = Nodes.find( node => node.id === activeItem.itemId );
	const { label, nodeType, story, synchronous, unreliable } = node;
	const inputs = { required: { label, nodeType }, props: { story, synchronous, unreliable } };

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
	const [ runCollapse ] = useMutation( COLLAPSE_NODE );

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
		e.stopPropagation();
		if ( enteredRequired( store.required ) ) {
			// in this query all entries are optional as they can be edited or not
			// at some point I'll have to refactor this on the server side
			let props = { ...store.props, ...store.required };
			let variables = { id: activeItem.itemId, props };
			runUpdate( { variables } )
				.catch( e => addLogMessage( client, `Failed when editing node: ` + e.message ) );
		}
		else {
			alert( 'Must provide required inputs!' );
		}
	};

	const handleDelete = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		runDelete( { variables: { id: activeItem.itemId } } )
			.catch( e => addLogMessage( client, `Failed when deleting node: ` + e.message ) );
		setActiveItem( client, 'app', 'app' );
	};

	const handleCollapse = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		runCollapse( { variables: { id: activeItem.itemId } } )
			.catch( err => addLogMessage( client, 'Error when collapsing node: ' + err.message ) );
	};

	const isCollapsable = () => store.required['nodeType'] === 'Container' || store.required['nodeType'] === 'Domain';
	const isCollapsed = () => {
		return isCollapsable() && node.collapsed;
	};

	const collapseButtonText = () => {
		if ( isCollapsed() ) {
			return 'Expand';
		}
		return 'Collapse';
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
				<Form.Select
					className='node-type'
					fluid
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
				<div className='edit-button-area edit-button-area-node'>
					<Button className='node-edit-button' color='green' disabled={ !editingData.hasEditRights } onClick={ handleSubmit }>Save!</Button>
					<Button className='node-edit-button' color='red' disabled={ !editingData.hasEditRights } onClick={ handleDelete }>Delete</Button>
					{ isCollapsable() &&
					<Button className='node-edit-button' color='teal' onClick={ handleCollapse }>{ collapseButtonText() }</Button>
					}
				</div>
			</Form>
			<Status data={ updateData } error={ updateError } loading={ updateLoading }/>
		</div>
	);
};

export default EditNode;