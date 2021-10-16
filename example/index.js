class Clock extends GreenTree.AbstractElement {
    constructor (props) {
        super(props);
        this.state = {date: new Date().toUTCString()};
        setInterval(() => this.tick(), 1000);
        console.log('Clock Children:', this.props.children)
        console.log('Clock Cust:', this.props.cust)
    }
    tick () {
        this.setState({date: new Date().toUTCString()});
    }
    create() {
        return GreenTree.createElement('div', { class: ['clock'] }, `${this.state.date}`);
    }
}

let ref_test = {};

const element = 
    GreenTree.createElement('root', {ref: ref_test},
        GreenTree.createElement('span', { class: ['first','second'], customProperty: 'lol' },
            GreenTree.createElement(Clock, { cust: 'green' }, GreenTree.createElement('span'), GreenTree.createElement('img'))
        )
    );

console.debug('REF:', ref_test)

/*const element2 = GreenTree.createElement2('div', {class: 'one'},
    GreenTree.createElement2('div', {class: 'two'}, 'text'),
    GreenTree.createElement2('div', {class: 'twosep'}, 'text2')
)*/

console.debug('stable:', element)
//console.debug('new:', element2)

GreenTree.Render(element, document.getElementById('app-mount'));