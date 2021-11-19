const app_mount = document.getElementById('app-mount');
function test_old() {
    class Clock extends GreenTree.AbstractElement {
        constructor (props) {
            super(props);
            this.state = {date: new Date().toUTCString()};
            setInterval(() => this.tick(), 1000);
            //console.log('Clock Children:', this.props.children)
            //console.log('Clock Cust:', this.props.cust)
        }
        tick () {
            this.setState({date: new Date().toUTCString()});
        }
        create() {
            return GreenTree.createElement('div', { class: ['clock'] }, `${this.state.date}`);
        }
    }

    class ClassElement extends GreenTree.AbstractElement {
        constructor(props) {
            super(props);
        }
        create() {
            return (
                GreenTree.createElement(Clock, { cust: 'green', cp: this.props.customProperty }, GreenTree.createElement('span'), GreenTree.createElement('img'))
            )
        }
    }

    class ClassElementWithProps extends GreenTree.AbstractElement {
        constructor(props) {
            super(props);
            console.debug('ClassElementWithProps:', this)
        }
        create() {
            return this.props.children;
        }
    }

    const var_element = GreenTree.createElement('div', {class:'var-element'}, 'var element')

    const function_element = function (props) {
        return GreenTree.createElement('div', { class: 'function-element' }, 'function element');
    }

    let ref_test = {};

    const element = 
        GreenTree.createElement('root', { ref: ref_test }, // Ref test
            GreenTree.createElement('span', { class: ['first','second'], customProperty: 'lol' }, // Element with custom property
                "Basic TEXT", // RAW text
                GreenTree.createElement(ClassElement, {customProperty: '5347'}), // Class Element
                //GreenTree.createElement(ClassElementWithProps, { prop: 1 }, ["Child1", "Child2"]), // Empty Class
                //["Child1", "Child2"], // Array Element
                null, // Null Element
                //GreenTree.createElement('span', { unsafeHTML: true }, "<a>hello</a>"), // Raw HTML Element
                //GreenTree.createElement('svg', { ns: 'http://www.w3.org/2000/svg' }, // SVG Element
                //    GreenTree.createElement('circle', { ns: 'http://www.w3.org/2000/svg', cx: 50, cy: 50, r: 10, fill: "red"})
                //),
                //var_element, // Variable Element
                GreenTree.createElement(function_element), // Function Element
            )
        );

    console.debug('Ref:', ref_test)
    console.debug('Element:', element)

    GreenTree.Render(element, app_mount); 
}

function test_new() {
    class ClassElement extends GreenTree.Component {
        constructor(props) {
            super(props);
        }
        render() {
            return (
                GreenTree.createElement2('span', { class: "span-element"}, "text child")
            )
        }
    }
    function function_element(props) {
        return GreenTree.createElement2('div', { class: "function-element" }, "function element");
    }
    var element2 = GreenTree.createElement2('root', { class: 'one' },
        GreenTree.createElement2('div', { class: 'two' }, 'text', 'textd'),
        GreenTree.createElement2('div', { class: 'twosep' }, 'text2'),
        GreenTree.createElement2(function_element),
        GreenTree.createElement2(ClassElement),
    );
    console.debug('AltDom:', element2);
    GreenTree.render(element2, app_mount);
}

//test_old();
test_new();