export default class GraphField {
	constructor( dim ) {
		this.dimensions = dim;
		this.field = this.createField( this.dimensions, this.dimensions );
	}

	// try a new approach:
	// define rules for nodes and apply them on the nodes.
	// possible factors:
	// link types
	// connected nodes count
	// node type (container/domain can be separate)
	// single connections between types with many nodes can be bigger (e.g. two connected domains)

	setCoords( dist ) {
		for ( let row = 0; row < this.dimensions; row++ ) {
			const rowCoord = row < 11 ? -dist * row : dist * row;
			for ( let col = 0; col < this.dimensions; col++ ) {
				let nodeInfo = this.field[row][col];
				if ( nodeInfo ) {
					const colCoord = col < 11 ? -dist * col : dist * col;
					nodeInfo.y = rowCoord;
					nodeInfo.x = colCoord;
				}
			}
		}
		// debugger
	}

	createField( length ) {
		let arr = new Array( length || 0 );
		let i = length;

		if ( arguments.length > 1 ) {
			let args = Array.prototype.slice.call( arguments, 1 );
			while ( i-- ) {
				arr[length - 1 - i] = this.createField.apply( this, args );
			}
		}

		return arr;
	}


	saveNodes( level, IDs ) {
		const rowDelta = this.getRowDelta( level );
		const colDelta = this.getColDelta( IDs );
		IDs.forEach( ( ID, index ) => {
			const colIndex = (index + 1) * colDelta;
			const rowIndex = rowDelta;
			this.field[rowIndex][colIndex] = {
				id: ID,
				radius_x: Math.floor( rowDelta / 2 ),
				radius_y: Math.ceil( colDelta / 2 ),
				colIndex,
				rowIndex,
			};
		} );
	}

	saveAround( nodeID, IDs ) {
		// debugger
		const nodeInfo = this.getNodeInfo( nodeID );
		if ( !nodeInfo ) {
			throw new NodeInfoException( 'No node info for this id was found in the field: ', nodeID );
		}
		this.printField();

		const { radius_x, radius_y, colIndex, rowIndex } = nodeInfo;
		IDs.forEach( id => {
			loop1:
			for ( let rowFactor = -1; rowFactor <= 1; rowFactor++ ) {
				for ( let colFactor = -1; colFactor <= 1; colFactor++ ) {
					if ( rowFactor || colFactor ) {
						const newRowIndex = rowIndex + rowFactor * radius_x;
						const newColIndex = colIndex + colFactor * radius_y;
						const nodeField = this.field[newRowIndex][newColIndex];
						if ( !nodeField ) {
							this.field[newRowIndex][newColIndex] = {
								id,
								radius_x: Math.floor( radius_x / 2 ),
								radius_y: Math.floor( radius_y / 2 ),
								colIndex: newColIndex,
								rowIndex: newRowIndex,
							};
							break loop1;
						}
					}
				}
			}
		} );
		this.printField();
	}

	printField() {
		console.log( '================================================================' );
		for ( let row = 0; row < this.dimensions; row++ ) {
			let line = row + ' || ';
			for ( let col = 0; col < this.dimensions; col++ ) {
				if ( this.field[row][col] ) {
					line += this.field[row][col].id + '| ';
				}
				else {
					line += col + '| ';
				}
			}
			line += '||';
			console.log( line );
		}
		console.log( '================================================================' );
	}

	getNodeInfo( nodeID ) {
		for ( let row = 0; row < this.dimensions; row++ ) {
			for ( let col = 0; col < this.dimensions; col++ ) {
				const nodeInfo = this.field[row][col];
				if ( nodeInfo?.id === nodeID ) {
					return nodeInfo;
				}
			}
		}
		return undefined;
	}

	getRowDelta( level ) {
		return Math.ceil( this.dimensions / (level + 1) );
	}

	getColDelta( IDs ) {
		return Math.ceil( this.dimensions / (IDs.length + 1) );
	}
}

function NodeInfoException( message ) {
	this.message = message;
	this.name = 'NodeInfoException';
}