import React, { useEffect, useReducer } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { EDITING_RIGHTS, LINKS_DATA, NODES_DATA } from '../queries/LocalQueries';
import { Form, Button } from 'semantic-ui-react';
import Status from './Status';
import { addLogMessage, deepCopy, enteredRequired, setActiveItem } from '../utils';
import { inputReducer } from '../InputReducer';
import { DELETE_LOCAL_LINK, UPDATE_LOCAL_LINK } from '../queries/LocalMutations';
import { arrowOptions, typeOptions } from '../linkOptions';

const EditLink = ( { activeItem, client } ) => {
	const { data: editingData } = useQuery( EDITING_RIGHTS );
	const { data: { Links } } = useQuery( LINKS_DATA );
	let linkToEdit = Links.find( aLink => aLink.id === activeItem.itemId );
	linkToEdit = deepCopy( linkToEdit );
	const { name: label, linkType, x: { id: x_id }, y: { id: y_id }, story, optional, x_end, y_end, sequence: seq } = linkToEdit;

	const inputs = {
		required: { label, linkType, x_id, y_id },
		props: { story: story ? story : '', optional },
		x_end: x_end ? x_end : { arrow: '', note: '' },
		y_end: y_end ? y_end : { arrow: '', note: '' },
		seq: seq ? seq : { group: '', seq: '' },
	};

	const { data: { Nodes } } = useQuery( NODES_DATA );
	let nodeOptions = Nodes.map( node => ({ 'text': node.label, 'value': node.id }) );
	nodeOptions.sort( ( node1, node2 ) => node1.text.localeCompare( node2.text ) );

	const [ store, dispatch ] = useReducer(
		inputReducer,
		{ ...inputs },
	);

	useEffect( () => {
		dispatch( { type: 'UPDATE', data: inputs } );
		// eslint-disable-next-line
	}, [ activeItem ] );

	const [ runUpdate, { data: updateData, loading: updateLoading, error: updateError } ] = useMutation( UPDATE_LOCAL_LINK );
	const [ runDelete ] = useMutation( DELETE_LOCAL_LINK );

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
		e.stopPropagation();
		if ( enteredRequired( store.required ) ) {
			const { required, x_end, y_end, seq } = store;
			const props = { ...store.props, ...required };
			runUpdate( { variables: { id: activeItem.itemId, props, x_end, y_end, seq } } )
				.catch( e => addLogMessage( client, `Failed when editing link: ` + e.message ) );
		}
		else {
			alert( 'Must provide required inputs!' );
		}
	};

	const handleDelete = ( e ) => {
		e.preventDefault();
		e.stopPropagation();
		runDelete( { variables: { id: activeItem.itemId } } )
			.catch( e => addLogMessage( client, `Failed when deleting link: ` + e.message ) );
		setActiveItem( client, 'app', 'app' );
	};

	const isPartOf = store.required['linkType'] === 'PartOf';

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
					label={ isPartOf ? 'Parent-Node' : 'X-Node' }
					placeholder={ isPartOf ? 'Parent-Node' : 'X-Node' }
					clearable
					search
					selection
					required
					onChange={ handleRequiredChange }
					options={ nodeOptions }
					name='x_id'
					value={ store.required['x_id'] }
					className={ 'create-required-select  link-x-node' }
				/>
				<Form.Dropdown
					fluid
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
					className='link-y-node'
					label={ isPartOf ? 'Child-Node' : 'Y-Node' }
					placeholder={ isPartOf ? 'Child-Node' : 'Y-Node' }
					required
					clearable
					search
					selection
					onChange={ handleRequiredChange }
					options={ nodeOptions }
					name='y_id'
					value={ store.required['y_id'] }
				/>
				<Form.Dropdown
					fluid
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
				<div className='edit-button-area edit-button-area-link'>
					<Button className='edit-button-link' color='green' disabled={ !editingData.hasEditRights } onClick={ handleSubmit }>Save!</Button>
					<Button className='edit-button-link' color='red' disabled={ !editingData.hasEditRights } onClick={ handleDelete }>Delete</Button>
				</div>
			</Form>
			<Status data={ updateData } error={ updateError } loading={ updateLoading }/>
		</div>
	);
};

export default EditLink;