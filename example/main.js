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

class ParamContainer extends GreenTree.AbstractElement {
    constructor(props) {
        super(props);
    }
    create() {
        return (
            GreenTree.createElement(Clock, { cust: 'green' }, GreenTree.createElement('span'), GreenTree.createElement('img'))
        )
    }
}

let ref_test = {};

const element = 
    GreenTree.createElement('root', {ref: ref_test},
        GreenTree.createElement('span', { class: ['first','second'], customProperty: 'lol' },
            GreenTree.createElement(ParamContainer, null),
            GreenTree.createElement('span', { unsafeHTML: true }, "<a>hello</a>"),
            GreenTree.createElement('svg', { ns: 'http://www.w3.org/2000/svg' },
                GreenTree.createElement('circle', { ns: 'http://www.w3.org/2000/svg', cx: 50, cy: 50, r: 10, fill: "red"})
            )
        )
    );

console.debug('Ref:', ref_test)

const element2 = GreenTree.createElement2('div', {class: 'one'},
    GreenTree.createElement2('div', {class: 'two'}, 'text', 'textd'),
    GreenTree.createElement2('div', {class: 'twosep'}, 'text2')
)

console.debug('Element:', element)
console.debug('AltDom:', element2)

//GreenTree.Render(element, document.getElementById('app-mount'));
GreenTree.render(element2, document.getElementById('app-mount'));