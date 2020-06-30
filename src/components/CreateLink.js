import React, { useEffect, useReducer } from 'react';
import '../css/LinkForm.css';
import { Form } from 'semantic-ui-react';
import Status from './Status';
import { useMutation, useQuery } from '@apollo/client';
import { addLogMessage, enteredRequired } from '../utils';
import { EDITING_RIGHTS, LAST_EDITOR_ACTIONS, NODES_DATA } from '../queries/LocalQueries';
import { CREATE_LOCAL_LINK } from '../queries/LocalMutations';
import { inputReducer } from '../InputReducer';
import { NodeImages } from '../Graph/Images';
import { arrowOptions, typeOptions } from '../linkOptions';
import Button from 'semantic-ui-react/dist/commonjs/elements/Button';

function CreateLink( { client } ) {
	const { data: editingData } = useQuery( EDITING_RIGHTS );

	const inputs = {
		required: { label: '', linkType: '', x_id: '', y_id: '' },
		props: { story: '', optional: false },
		x_end: { arrow: '', note: '' },
		y_end: { arrow: '', note: '' },
		seq: { group: '', seq: '' },
	};

	const { data: { Nodes } } = useQuery( NODES_DATA );
	const nodeOptions = Nodes.map( node => ({ 'text': node.label, 'value': node.id, 'image': NodeImages[node.nodeType] }) );
	nodeOptions.sort( ( node1, node2 ) => node1.text.localeCompare( node2.text ) );

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs },
	);

	// get the last two clicked nodeIDs
	const { data: actionData } = useQuery( LAST_EDITOR_ACTIONS );
	const foundNodes = [];
	for ( let action of actionData.lastEditorActions ) {
		if ( action.type === 'node' ) {
			foundNodes.unshift( action.itemID );
			if ( foundNodes.length === 2 ) {
				break;
			}
		}
	}
	if ( foundNodes[0] ) {
		inputs.required.x_id = foundNodes[0];
	}
	if ( foundNodes[1] ) {
		inputs.required.y_id = foundNodes[1];
	}

	const [ runCreateLink, { data, loading, error } ] = useMutation( CREATE_LOCAL_LINK );

	const handleEndChange = ( e, data, xy ) => {
		const name = data.name;
		const value = data.value;
		dispatch( { type: `ADD_${ xy.toUpperCase() }_END`, name, value } );
	};

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

	const handleSeqChange = ( e, data ) => {
		const name = data.name;
		const value = data.value;
		dispatch( { type: 'ADD_SEQ', name, value } );
	};

	const handleSubmit = ( e ) => {
		e.preventDefault();
		if ( enteredRequired( store.required ) ) {
			addLogMessage( client, `creating link` );
			const { required, props, x_end, y_end, seq } = store;
			const variables = { ...required, props, x_end, y_end, seq };
			runCreateLink( { variables } )
				.catch( e => addLogMessage( client, 'error when creating link ' + e.message ) );
		}
		else {
			alert( 'Must provide required inputs!' );
		}
	};

	const isPartOf = store.required['linkType'] === 'PartOf';
	useEffect( () => {
		if ( isPartOf ) {
			dispatch( { type: 'ADD_X_END', name: 'arrow', value: 'Default' } );
		}
		else {
			dispatch( { type: 'ADD_X_END', name: 'arrow', value: '' } );
		}
		// eslint-disable-next-line
	}, [ isPartOf ] );

	return (
		<div className='link-form'>
			<Form className='link-form-grid'>
				<Form.Input
					fluid
					className='link-label'
					label='Label'
					placeholder='Label'
					onChange={ handleRequiredChange }
					required
					name='label'
					value={ store.required['label'] }
				/>
				<Form.Dropdown
					className='link-type'
					fluid
					floating
					clearable
					search
					selection
					label='Type'
					options={ typeOptions }
					placeholder='Type'
					onChange={ handleRequiredChange }
					required
					name='linkType'
					value={ store.required['linkType'] }
				/>
				<Form.Dropdown
					fluid
					floating
					clearable
					search
					selection
					className='link-x-node'
					label={ isPartOf ? 'Parent-Node' : 'X-Node' }
					placeholder={ isPartOf ? 'Parent-Node' : 'X-Node' }
					required
					onChange={ handleRequiredChange }
					options={ nodeOptions }
					name='x_id'
					value={ store.required['x_id'] }
				/>
				<Form.Dropdown
					fluid
					floating
					clearable
					search
					selection
					className='link-x-arrow'
					label={ isPartOf ? 'Parent-Arrow' : 'X-Arrow' }
					placeholder={ isPartOf ? 'Parent-Arrow' : 'X-Arrow' }
					name='arrow'
					value={ store.x_end['arrow'] }
					options={ arrowOptions }
					onChange={ ( e, data ) => handleEndChange( e, data, 'x' ) }
				/>
				<Form.Input
					fluid
					className='link-x-note'
					label={ isPartOf ? 'Parent-Note' : 'X-Note' }
					placeholder={ isPartOf ? 'Parent-Note' : 'X-Note' }
					onChange={ ( e, data ) => handleEndChange( e, data, 'x' ) }
					name='note'
					value={ store.x_end['note'] }
				/>
				<Form.Dropdown
					fluid
					floating
					clearable
					search
					selection
					className='link-y-node'
					label={ isPartOf ? 'Child-Node' : 'Y-Node' }
					placeholder={ isPartOf ? 'Child-Node' : 'Y-Node' }
					required
					onChange={ handleRequiredChange }
					options={ nodeOptions }
					name='y_id'
					value={ store.required['y_id'] }
				/>
				<Form.Dropdown
					fluid
					floating
					clearable
					search
					selection
					className='link-y-arrow'
					label={ isPartOf ? 'Child-Arrow' : 'Y-Arrow' }
					placeholder={ isPartOf ? 'Child-Arrow' : 'Y-Arrow' }
					name='arrow'
					value={ store.y_end['arrow'] }
					options={ arrowOptions }
					onChange={ ( e, data ) => handleEndChange( e, data, 'y' ) }
				/>
				<Form.Input
					fluid
					className='link-y-note'
					label={ isPartOf ? 'Child-Note' : 'Y-Note' }
					placeholder={ isPartOf ? 'Child-Note' : 'Y-Note' }
					onChange={ ( e, data ) => handleEndChange( e, data, 'y' ) }
					name='note'
					value={ store.y_end['note'] }
				/>
				<Form.Input
					fluid
					className='link-story'
					label='Story'
					placeholder='Story'
					onChange={ handlePropsChange }
					name='story'
					value={ store.props['story'] }
				/>
				<Form.Input
					fluid
					className='link-sequence-group'
					label='Sequence Group'
					placeholder='Group'
					onChange={ handleSeqChange }
					name='group'
					value={ store.seq['group'] }
				/>
				<Form.Input
					fluid
					className='link-sequence-number'
					label='Sequence Number'
					placeholder='0'
					onChange={ handleSeqChange }
					name='seq'
					value={ store.seq['seq'] }
				/>
				<Form.Checkbox
					className='link-optional'
					label='optional'
					onChange={ handlePropsChange }
					checked={ store.props['optional'] }
					name='optional'
				/>
				{/* if the user doesn't have editing rights, it should be disabled */ }
			</Form>
			<Button className='save-button' color='green' disabled={ !editingData.hasEditRights } onClick={ handleSubmit }>Save!</Button>
			<Status data={ data } error={ error } loading={ loading }/>
		</div>
	);
}

export default CreateLink;
