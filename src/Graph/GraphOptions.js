const highlightColor = '#008FD5';
const white = '#ffffff';

const options = {
	layout: {
		improvedLayout: true,
	},
	edges: {
		color: '#000000',
		physics: true,
		width: 2,
		smooth: {
			enabled: false,
		},
		font: {
			size: 12,
			align: 'middle',
		},
		arrows: {
			to: { enabled: false },
			from: { enabled: false },
		},
	},
	nodes: {
		borderWidth: 0,
		physics: false,
		widthConstraint: {
			minimum: 25,
			maximum: 50,
		},
		chosen: {
			node: function ( values ) {
				values.borderWidth = 2;
				values.borderColor = highlightColor;
			},
			label: function ( values ) {
				values.color = highlightColor;
			}
		},
		color: {
			border: white,
			background: white,
			highlight: {				
				background: white,
			}
		},
	},
	height: '100%',
	autoResize: true,
	interaction: {
		hoverConnectedEdges: false,
		selectConnectedEdges: false,
	},
	physics: {
		enabled: true,
	},
};

export default options;

